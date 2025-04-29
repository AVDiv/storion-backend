import { Injectable, Logger } from '@nestjs/common';
import { PostHogEventDto } from './dto/posthog-webhook.dto';

interface PageSession {
  entryTimestamp: Date;
  articleId?: string;
  articleTitle?: string;
  articleCategories?: any[];
  articleTags?: string[];
  url?: string;
}

@Injectable()
export class SessionTrackingService {
  private readonly logger = new Logger(SessionTrackingService.name);
  private readonly userSessions = new Map<string, Map<string, PageSession>>();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor() {
    // Set up periodic cleanup of stale sessions
    setInterval(() => this.cleanupStaleSessions(), 15 * 60 * 1000); // Run every 15 minutes
  }

  /**
   * Record a page entry event for a user on a specific page
   */
  recordPageEntry(distinctId: string, event: PostHogEventDto): void {
    if (!distinctId) return;

    const { properties, timestamp } = event;
    const currentUrl = properties.$current_url;

    if (!currentUrl) {
      this.logger.debug(`Pageview event missing current URL for user ${distinctId}`);
      return;
    }

    // Extract article data if available
    const articleId = properties.article_id ||
      (properties.article_data && properties.article_data.id) || null;

    const articleTitle = properties.article_title ||
      (properties.article_data && properties.article_data.title) || null;

    let articleCategories = null;
    if (properties.article_categories) {
      articleCategories = properties.article_categories;
    } else if (properties.article_data && properties.article_data.categories) {
      articleCategories = properties.article_data.categories;
    }

    const articleTags = properties.article_tags ||
      (properties.article_data && properties.article_data.tags) || null;

    // Get or create user session map
    if (!this.userSessions.has(distinctId)) {
      this.userSessions.set(distinctId, new Map<string, PageSession>());
    }

    const userSession = this.userSessions.get(distinctId);

    // Create page session data
    const pageSession: PageSession = {
      entryTimestamp: timestamp ? new Date(timestamp) : new Date(),
      url: currentUrl,
      articleId,
      articleTitle,
      articleCategories,
      articleTags,
    };

    userSession.set(currentUrl, pageSession);
    this.logger.debug(`Recorded page entry for user ${distinctId} on ${currentUrl}`);
  }

  /**
   * Record a page exit event and return time spent data
   */
  recordPageExit(distinctId: string, event: PostHogEventDto): {
    timeSpent?: number;
    articleData?: any;
  } {
    if (!distinctId) return {};

    const { properties, timestamp } = event;
    const currentUrl = properties.$current_url;

    if (!currentUrl) return {};

    // Check if we have a session for this user and URL
    const userSessionMap = this.userSessions.get(distinctId);
    if (!userSessionMap || !userSessionMap.has(currentUrl)) {
      return {};
    }

    // Get the page session
    const pageSession = userSessionMap.get(currentUrl);
    const exitTime = timestamp ? new Date(timestamp) : new Date();
    const entryTime = pageSession.entryTimestamp;

    // Calculate time spent in seconds
    const timeSpent = Math.round((exitTime.getTime() - entryTime.getTime()) / 1000);

    // Cleanup session data
    userSessionMap.delete(currentUrl);
    if (userSessionMap.size === 0) {
      this.userSessions.delete(distinctId);
    }

    // Return time spent and article data
    const articleData = pageSession.articleId ? {
      id: pageSession.articleId,
      title: pageSession.articleTitle,
      categories: pageSession.articleCategories,
      tags: pageSession.articleTags
    } : undefined;

    this.logger.debug(`User ${distinctId} spent ${timeSpent}s on ${currentUrl}`);
    return {
      timeSpent,
      articleData
    };
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(distinctId: string): Map<string, PageSession> | undefined {
    return this.userSessions.get(distinctId);
  }

  /**
   * Process timeout for a specific URL - called periodically or when needed
   */
  processSessionTimeout(distinctId: string, url: string): {
    timeSpent?: number;
    articleData?: any;
  } | null {
    const userSessionMap = this.userSessions.get(distinctId);
    if (!userSessionMap || !userSessionMap.has(url)) {
      return null;
    }

    const pageSession = userSessionMap.get(url);
    const now = new Date();
    const sessionAge = now.getTime() - pageSession.entryTimestamp.getTime();

    // If session is older than timeout, calculate time spent
    if (sessionAge > this.SESSION_TIMEOUT) {
      // Default to SESSION_TIMEOUT / 1000 seconds (or less if session is younger)
      const timeSpent = Math.min(this.SESSION_TIMEOUT, sessionAge) / 1000;

      // Prepare article data if available
      const articleData = pageSession.articleId ? {
        id: pageSession.articleId,
        title: pageSession.articleTitle,
        categories: pageSession.articleCategories,
        tags: pageSession.articleTags
      } : undefined;

      // Clean up the session
      userSessionMap.delete(url);
      if (userSessionMap.size === 0) {
        this.userSessions.delete(distinctId);
      }

      this.logger.debug(`Timed out session for user ${distinctId} on ${url} after ${timeSpent}s`);
      return { timeSpent, articleData };
    }

    return null;
  }

  /**
   * Clean up stale sessions and get time spent data for processing
   * @returns Array of timed out sessions
   */
  cleanupStaleSessions(): Array<{
    distinctId: string;
    url: string;
    timeSpent: number;
    articleData?: any;
  }> {
    const now = new Date();
    const timedOutSessions = [];

    // Iterate through all user sessions
    for (const [distinctId, userSessionMap] of this.userSessions.entries()) {
      for (const [url, pageSession] of userSessionMap.entries()) {
        const sessionAge = now.getTime() - pageSession.entryTimestamp.getTime();

        if (sessionAge > this.SESSION_TIMEOUT) {
          // Session has timed out
          const timeSpent = Math.min(this.SESSION_TIMEOUT, sessionAge) / 1000;

          // Prepare article data if available
          const articleData = pageSession.articleId ? {
            id: pageSession.articleId,
            title: pageSession.articleTitle,
            categories: pageSession.articleCategories,
            tags: pageSession.articleTags
          } : undefined;

          timedOutSessions.push({
            distinctId,
            url,
            timeSpent,
            articleData
          });

          // Remove from map
          userSessionMap.delete(url);
        }
      }

      // Clean up empty session maps
      if (userSessionMap.size === 0) {
        this.userSessions.delete(distinctId);
      }
    }

    if (timedOutSessions.length > 0) {
      this.logger.log(`Cleaned up ${timedOutSessions.length} stale sessions`);
    }

    // Return timed out sessions for processing
    return timedOutSessions;
  }
}
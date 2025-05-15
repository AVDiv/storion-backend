import { Injectable, Logger } from '@nestjs/common';
import { PostHogEventDto, PostHogWebhookDto } from './dto/posthog-webhook.dto';
import { UserProfileService } from './user-profile.service';
import { SessionTrackingService } from './session-tracking.service';
import { TextAnalysisService } from './text-analysis.service';
import { ClickHistoryItemDto } from './dto/user-profile.dto';
import { UserEntity } from 'src/prisma/entities/user/user.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly userEntity: UserEntity,
    private readonly sessionTrackingService: SessionTrackingService,
    private readonly textAnalysisService: TextAnalysisService
  ) { }

  /**
   * Process a PostHog webhook payload (single event)
   */
  async processWebhook(payload: PostHogWebhookDto): Promise<boolean> {
    try {
      const { event } = payload;
      return await this.processEvent(event);
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Process a single event
   */
  async processEvent(event: PostHogEventDto): Promise<boolean> {
    try {
      const { distinct_id, event: eventName, properties, timestamp } = event;

      // Skip events without distinct_id
      if (!distinct_id) {
        this.logger.warn(`Skipping event ${eventName}: missing distinct_id`);
        return false;
      }

      // Process based on event type
      switch (eventName) {
        case '$pageview':
          // Record page entry and process if it's an article page
          this.sessionTrackingService.recordPageEntry(distinct_id, event);

          // If this is an article pageview with complete data, process it immediately
          if (properties.article_id || (properties.article_data && properties.article_data.id)) {
            await this.processArticleInteraction(event, 'clicked_article');
          }
          break;

        case '$pageleave':
          // Process page exit and update user profile with time spent data
          const exitData = this.sessionTrackingService.recordPageExit(distinct_id, event);
          if (exitData.timeSpent && exitData.articleData) {
            // Create a synthetic event with the article data and time spent
            const articleEvent = {
              ...event,
              event: 'read_article',
              properties: {
                ...properties,
                article_id: exitData.articleData.id,
                article_title: exitData.articleData.title,
                article_categories: exitData.articleData.categories,
                article_tags: exitData.articleData.tags,
                time_spent: exitData.timeSpent
              }
            };

            // Process as a read event with time spent data
            await this.processArticleInteraction(articleEvent, 'read_article');
          }
          break;

        case 'clicked_article':
          await this.processArticleInteraction(event, 'clicked_article');
          break;

        case 'read_article':
          await this.processArticleInteraction(event, 'read_article');
          break;

        case 'saved_article':
          await this.processArticleInteraction(event, 'saved_article');
          break;

        case 'user.search':
          // Handle search events - might be useful for personalization in the future
          this.logger.debug(`Received search event: ${JSON.stringify(properties.query)}`);
          break;

        case 'onboarding.completed':
          // Process onboarding completion events to initialize user profile
          await this.processOnboardingCompletion(event);
          break;

        default:
          this.logger.debug(`Unhandled event type: ${eventName}`);
          break;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error processing event: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Process multiple events (batch processing)
   */
  async processEvents(events: PostHogEventDto[]): Promise<{
    processed: number;
    skipped: number;
    failed: number;
  }> {
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const event of events) {
      try {
        const result = await this.processEvent(event);
        if (result) {
          processed++;
        } else {
          skipped++;
        }
      } catch (error) {
        this.logger.error(`Failed to process event: ${error.message}`, error.stack);
        failed++;
      }
    }

    return { processed, skipped, failed };
  }

  /**
   * Process article interaction events (click, read, save)
   * These are regular events that require tracking consent
   */
  private async processArticleInteraction(
    event: PostHogEventDto,
    interactionType: 'clicked_article' | 'read_article' | 'saved_article'
  ): Promise<void> {
    const { distinct_id, properties, timestamp } = event;

    // Extract article data from different possible property locations
    const articleId =
      properties.article_id ||
      (properties.article_data && properties.article_data.id) ||
      null;

    if (!articleId) {
      this.logger.warn('Article interaction event missing article ID');
      return;
    }

    // Extract article metadata 
    const title =
      properties.article_title ||
      (properties.article_data && properties.article_data.title) ||
      'Unknown Article';

    // Handle different formats of categories (array of strings or array of objects)
    let categories: any[] = [];
    if (properties.article_categories) {
      // New format from posthog-events.md update
      categories = properties.article_categories;
    } else if (properties.article_data && properties.article_data.categories) {
      // Legacy format
      categories = properties.article_data.categories;
    }

    // Extract tags
    const tags =
      properties.article_tags ||
      (properties.article_data && properties.article_data.tags) ||
      [];

    // Extract time spent (if available)
    const timeSpent = properties.time_spent || undefined;

    // Create click history item
    const clickData: ClickHistoryItemDto = {
      articleId,
      title,
      categories: Array.isArray(categories) ?
        (typeof categories[0] === 'string' ? categories : categories.map(c => c.name)) :
        [],
      tags,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };

    // Record the interaction with appropriate weighting
    // Pass isOnboarding=false since this is a regular event
    await this.userProfileService.recordArticleInteraction(
      distinct_id,
      clickData,
      interactionType,
      timeSpent,
      false // Not part of onboarding flow
    );
  }

  /**
   * Process onboarding completion events to initialize user preferences
   * These events bypass tracking consent check since they're explicitly initiated by the user
   */
  private async processOnboardingCompletion(event: PostHogEventDto): Promise<void> {
    const { distinct_id, properties } = event;

    if (!distinct_id) return;

    // Get onboarding details from the database
    const userData = await this.userEntity.findUserById(distinct_id);

    // Extract explicitly selected topics from the event properties
    const selectedTopics = userData.topics || [];

    // Extract keywords to use as initial tags with weights
    const description = userData.description || '';
    const extractedKeywords = this.textAnalysisService.extractKeywordsFromText(description, {
      maxKeywords: 15,
      minKeywordLength: 3,
      minWeight: 0.5,
      removeStopwords: true
    });

    // First, initialize with explicitly selected topics (weight = 4)
    if (selectedTopics.length > 0) {
      await this.userProfileService.updateUserPreferences(
        distinct_id,
        selectedTopics,
        [], // No tags from explicit selection
        2,  // Higher weight for explicit preferences
        undefined, // No time spent
        true
      );
    }

    // Process extracted keywords as tags
    if (extractedKeywords.length > 0) {
      // Create array of just the keywords
      const tags = extractedKeywords.map(item => item.keyword);

      // Get the average weight of the extracted keywords
      const avgKeywordWeight = extractedKeywords.reduce((sum, item) => sum + item.weight, 0) /
        extractedKeywords.length;

      // Add the keywords as tags to the user preferences
      await this.userProfileService.updateUserPreferences(
        distinct_id,
        [], // No categories for this update
        tags, // Use extracted keywords as tags
        avgKeywordWeight * 2, // Scale up tag weights slightly
        undefined, // No time spent
        true // Bypass tracking consent check for onboarding
      );

      this.logger.log(
        `Added ${tags.length} tags to user ${distinct_id} profile from description with average weight ${avgKeywordWeight.toFixed(2)}`
      );
    }
  }

  /**
   * Process timed-out sessions to ensure we capture reading time
   * even when a user doesn't generate a page leave event
   * These events require tracking consent
   */
  processTimedOutSessions(): void {
    const timedOutSessions = this.sessionTrackingService.cleanupStaleSessions();

    if (!timedOutSessions || timedOutSessions.length === 0) {
      return;
    }

    this.logger.log(`Processing ${timedOutSessions.length} timed out sessions`);

    // Process each timed out session
    for (const session of timedOutSessions) {
      if (session.articleData && session.timeSpent) {
        // Create a synthetic event to process
        const syntheticEvent: PostHogEventDto = {
          event: 'read_article',
          distinct_id: session.distinctId,
          properties: {
            article_id: session.articleData.id,
            article_title: session.articleData.title,
            article_categories: session.articleData.categories,
            article_tags: session.articleData.tags,
            time_spent: session.timeSpent,
            $current_url: session.url
          },
          timestamp: new Date().toISOString()
        };

        // Process the synthetic event (requires tracking consent)
        this.processArticleInteraction(syntheticEvent, 'read_article')
          .catch(err => this.logger.error(`Error processing timed out session: ${err.message}`));
      }
    }
  }
}
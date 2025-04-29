import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClickHistoryItemDto } from './dto/user-profile.dto';
import { NewsEventCategoryDto } from './dto/posthog-webhook.dto';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(private readonly prismaService: PrismaService) { }

  /**
   * Get a user's profile by distinct_id (which could be a user ID or email)
   * Creates a default profile if none exists
   */
  async getOrCreateUserProfile(distinctId: string) {
    try {
      // Try to find user by ID first
      let user = await this.prismaService.user.findFirst({
        where: {
          OR: [
            { email: distinctId }
          ]
        }
      });

      if (!user) {
        this.logger.warn(`User with ID or email ${distinctId} not found`);
        return null;
      }

      // Find or create profile
      let profile = await this.prismaService.userProfile.findUnique({
        where: { userId: user.id }
      });

      if (!profile) {
        this.logger.log(`Creating new profile for user ${user.id}`);
        profile = await this.prismaService.userProfile.create({
          data: {
            userId: user.id,
            shortTermPreferences: { categories: {}, tags: {} },
            longTermPreferences: { categories: {}, tags: {} },
            clickHistory: []
          }
        });
      }

      return profile;
    } catch (error) {
      this.logger.error(`Error getting user profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user preferences based on interaction with content
   * @param distinctId User identifier 
   * @param categories Array of category names or category objects with scores
   * @param tags Array of tags
   * @param weight Weight to apply based on interaction type
   * @param timeSpent Optional time spent on content for weight modification
   */
  async updateUserPreferences(
    distinctId: string,
    categories: string[] | NewsEventCategoryDto[],
    tags: string[] = [],
    weight: number = 1,
    timeSpent?: number
  ) {
    try {
      const profile = await this.getOrCreateUserProfile(distinctId);
      if (!profile) return null;

      // Apply time spent modifier if available (>30s × 1.2)
      if (timeSpent && timeSpent > 30) {
        weight *= 1.2;
      }

      // Extract current preferences
      const shortTermPrefs = profile.shortTermPreferences as {
        categories: Record<string, number>;
        tags: Record<string, number>;
      };

      const longTermPrefs = profile.longTermPreferences as {
        categories: Record<string, number>;
        tags: Record<string, number>;
      };

      // Update short-term and long-term category preferences
      const updatedShortTermCategories = { ...shortTermPrefs.categories };
      const updatedLongTermCategories = { ...longTermPrefs.categories };

      // Handle both string[] and NewsEventCategoryDto[] formats
      if (categories.length > 0) {
        if (typeof categories[0] === 'string') {
          // Handle string[] format
          (categories as string[]).forEach(category => {
            updatedShortTermCategories[category] = (updatedShortTermCategories[category] || 0) + weight;
            updatedLongTermCategories[category] = (updatedLongTermCategories[category] || 0) + weight;
          });
        } else {
          // Handle NewsEventCategoryDto[] format
          (categories as NewsEventCategoryDto[]).forEach(categoryObj => {
            const { name, score } = categoryObj;
            // Apply weight proportionally to category relevance score
            const categoryWeight = weight * (score / 100);
            updatedShortTermCategories[name] = (updatedShortTermCategories[name] || 0) + categoryWeight;
            updatedLongTermCategories[name] = (updatedLongTermCategories[name] || 0) + categoryWeight;
          });
        }
      }

      // Update short-term and long-term tag preferences
      const updatedShortTermTags = { ...shortTermPrefs.tags };
      const updatedLongTermTags = { ...longTermPrefs.tags };

      tags.forEach(tag => {
        updatedShortTermTags[tag] = (updatedShortTermTags[tag] || 0) + weight;
        updatedLongTermTags[tag] = (updatedLongTermTags[tag] || 0) + weight;
      });

      // Prepare updated preferences objects
      const updatedShortTermPrefs = {
        categories: updatedShortTermCategories,
        tags: updatedShortTermTags
      };

      const updatedLongTermPrefs = {
        categories: updatedLongTermCategories,
        tags: updatedLongTermTags
      };

      // Update profile in database
      return await this.prismaService.userProfile.update({
        where: { id: profile.id },
        data: {
          shortTermPreferences: updatedShortTermPrefs,
          longTermPreferences: updatedLongTermPrefs,
          lastInteraction: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Error updating user preferences: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add article interaction to user history and update profile
   */
  async recordArticleInteraction(
    distinctId: string,
    clickData: ClickHistoryItemDto,
    interactionType: 'clicked_article' | 'read_article' | 'saved_article',
    timeSpent?: number
  ) {
    try {
      const profile = await this.getOrCreateUserProfile(distinctId);
      if (!profile) return null;

      // Get current click history and add new item (limited to 20 items)
      const currentHistory = (profile.clickHistory as any[]) || [];
      const updatedHistory = [
        ...currentHistory.slice(-19),
        clickData
      ];

      // Determine weight based on interaction type
      let weight = 1; // Default for clicked_article

      switch (interactionType) {
        case 'read_article':
          weight = 2;
          break;
        case 'saved_article':
          weight = 3;
          break;
        default:
          weight = 1;
      }

      // Update preferences based on categories and tags in the clicked article
      await this.updateUserPreferences(
        distinctId,
        clickData.categories || [],
        clickData.tags || [],
        weight,
        timeSpent
      );

      // Update click history
      return await this.prismaService.userProfile.update({
        where: { id: profile.id },
        data: {
          clickHistory: updatedHistory,
          lastInteraction: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Error recording article interaction: ${error.message}`, error.stack);
      throw error;
    }
  }
}
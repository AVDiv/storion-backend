import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/prisma/entities/user/user.entity';
import { OnboardingUserDto } from 'src/models/user/onboarding-user.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly userEntity: UserEntity) { }

  /**
   * Updates a user's onboarding information and marks onboarding as complete
   * 
   * @param {string} userId - ID of the user to update onboarding for
   * @param {OnboardingUserDto} onboardingData - Onboarding data to set
   * @returns {Promise<{ success: boolean, message: string }>} Operation result
   */
  async updateOnboarding(userId: string, onboardingData: OnboardingUserDto) {
    await this.userEntity.updateOnboarding(userId, onboardingData);
    return {
      success: true,
      message: 'Onboarding completed successfully',
    };
  }

  /**
   * Gets the current onboarding data for a user
   * 
   * @param {string} userId - ID of the user to get onboarding data for
   * @returns {Promise<any>} Onboarding data and completion status
   */
  async getOnboardingData(userId: string) {
    return this.userEntity.getOnboardingData(userId);
  }

  /**
   * Checks if a user has completed onboarding
   * 
   * @param {string} userId - ID of the user to check
   * @returns {Promise<boolean>} Whether onboarding is complete
   */
  async isOnboardingComplete(userId: string): Promise<boolean> {
    return this.userEntity.isOnboardingComplete(userId);
  }
}
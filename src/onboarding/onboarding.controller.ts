import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingUserDto } from 'src/models/user/onboarding-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from 'src/models/request/request-with-user.interface';
import { JwtToken } from 'src/models/request/jwt-token.interface';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) { }

  /**
   * Submit user onboarding information
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async submitOnboarding(
    @Request() req: RequestWithUser,
    @Body() onboardingData: OnboardingUserDto,
  ) {
    const userId = (req.user as JwtToken).userId;
    return this.onboardingService.updateOnboarding(userId, onboardingData);
  }

  /**
   * Get user onboarding information and status
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getOnboardingStatus(@Request() req: RequestWithUser) {
    const userId = (req.user as JwtToken).userId;
    return this.onboardingService.getOnboardingData(userId);
  }

  /**
   * Check if user has completed onboarding
   */
  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async checkOnboardingStatus(@Request() req: RequestWithUser) {
    const userId = (req.user as JwtToken).userId;
    const isComplete = await this.onboardingService.isOnboardingComplete(userId);

    return {
      completed: isComplete
    };
  }
}
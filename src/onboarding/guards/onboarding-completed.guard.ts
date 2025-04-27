import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OnboardingService } from '../onboarding.service';
import { RequestWithUser } from 'src/models/request/request-with-user.interface';

/**
 * Guard to ensure user has completed onboarding
 * 
 * @description
 * This guard checks if the user has completed the onboarding process.
 * If not, it throws a ForbiddenException.
 * 
 * @example
 * @UseGuards(AuthGuard('jwt'), OnboardingCompletedGuard)
 * @Get('protected-endpoint')
 * getProtectedResource() {
 *   // This endpoint is only accessible to users who have completed onboarding
 * }
 */
@Injectable()
export class OnboardingCompletedGuard implements CanActivate {
  constructor(private readonly onboardingService: OnboardingService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    // Assert the expected shape of the user object after JWT authentication.
    const user = request.user as { userId?: string };
    const userId = user?.userId;

    if (!userId) {
      // Consider a more specific error message if user exists but userId doesn't
      throw new ForbiddenException('Authentication required or user ID missing');
    }

    const isOnboardingCompleted = await this.onboardingService.isOnboardingComplete(userId);

    if (!isOnboardingCompleted) {
      throw new ForbiddenException('Please complete onboarding before accessing this resource');
    }

    return true;
  }
}
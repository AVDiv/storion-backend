import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { UserModule } from 'src/prisma/entities/user/user.module';
import { OnboardingCompletedGuard } from './guards/onboarding-completed.guard';

@Module({
  imports: [UserModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingCompletedGuard],
  exports: [OnboardingService, OnboardingCompletedGuard],
})
export class OnboardingModule { }
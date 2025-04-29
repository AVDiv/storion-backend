import { Module } from '@nestjs/common';
import { UserModule } from 'src/prisma/entities/user/user.module';
import { EmailNotRegisteredValidator } from './email-not-registered/email-not-registered.rule';
import { EmailRegisteredValidator } from './email-registered/email-registered.rule';
import { AccountRestrictionValidator } from './account-restriction/account-restriction.rule';
import { OnboardingCompletedValidator } from './onboarding-completed/onboarding-completed.rule';
import { TrackingConsentValidator } from './tracking-consent/tracking-consent.rule';

@Module({
  imports: [UserModule],
  providers: [
    EmailNotRegisteredValidator,
    EmailRegisteredValidator,
    AccountRestrictionValidator,
    OnboardingCompletedValidator,
    TrackingConsentValidator,
  ],
  exports: [
    EmailNotRegisteredValidator,
    EmailRegisteredValidator,
    AccountRestrictionValidator,
    OnboardingCompletedValidator,
    TrackingConsentValidator,
  ],
})
export class ValidationRulesModule { }

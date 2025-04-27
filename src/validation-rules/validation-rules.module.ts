import { Module } from '@nestjs/common';
import { EmailNotRegisteredValidator } from './email-not-registered/email-not-registered.rule';
import { UserModule } from 'src/prisma/entities/user/user.module';
import { EmailRegisteredValidator } from './email-registered/email-registered.rule';
import { AccountRestrictionValidator } from './account-restriction/account-restriction.rule';
import { OnboardingCompletedValidator } from './onboarding-completed/onboarding-completed.rule';

@Module({
  imports: [UserModule],
  providers: [
    EmailNotRegisteredValidator,
    EmailRegisteredValidator,
    AccountRestrictionValidator,
    OnboardingCompletedValidator,
  ],
  exports: [
    EmailNotRegisteredValidator,
    EmailRegisteredValidator,
    AccountRestrictionValidator,
    OnboardingCompletedValidator,
  ],
})
export class ValidationRulesModule { }

import { Module } from '@nestjs/common';
import { EmailNotRegisteredValidator } from './email-not-registered.rule';
import { UserModule } from 'src/prisma/entities/user/user.module';
import { EmailRegisteredValidator } from './email-registered.rule';
import { AccountRestrictionValidator } from './account-restriction.rule';

@Module({
  imports: [UserModule],
  providers: [
    EmailNotRegisteredValidator,
    EmailRegisteredValidator,
    AccountRestrictionValidator,
  ],
  exports: [
    EmailNotRegisteredValidator,
    EmailRegisteredValidator,
    AccountRestrictionValidator,
  ],
})
export class ValidationRulesModule { }

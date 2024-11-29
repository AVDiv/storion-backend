
import { Module } from '@nestjs/common';
import { EmailNotRegisteredValidator } from './email-not-registered.rule';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  providers: [EmailNotRegisteredValidator],
  exports: [EmailNotRegisteredValidator]
})
export class ValidationRulesModule { }
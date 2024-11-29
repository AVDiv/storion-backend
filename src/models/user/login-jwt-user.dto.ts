import { IsEmail, IsString } from 'class-validator';
import { AccountNotRestricted } from 'src/validation-rules';
import { EmailRegistered } from 'src/validation-rules/email-registered.rule';

export class LoginJwtUserDto {
  @IsEmail()
  @EmailRegistered()
  @AccountNotRestricted()
  email: string;

  @IsString()
  password: string;
}

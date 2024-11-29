import { IsEmail, IsStrongPassword, MaxLength } from 'class-validator';
import { EmailNotRegistered } from 'src/validation-rules/email-not-registered.rule';
import { IsName } from 'src/validation-rules/name.rule';

export class CreateUserDto {
  @IsName()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @EmailNotRegistered()
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}

import { IsEmail, IsString, IsUrl } from 'class-validator';

export class LoginGoogleUserDto {
  @IsString()
  accessToken: string;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsUrl()
  picture: string;
}

import { Request } from 'express';
import { JwtToken } from './jwt-token.interface';
import { LoginGoogleUserDto } from '../user/login-google-user.dto';

export interface RequestWithUser extends Request {
  user: (JwtToken | LoginGoogleUserDto);
}

import { Request } from 'express';
import { JwtToken } from './jwt-token.interface';

export interface RequestWithUser extends Request {
  user: JwtToken;
}

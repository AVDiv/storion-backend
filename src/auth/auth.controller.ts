import { Controller, Request, Post, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Request() req) {
    return this.authService.generateTokens(req.body);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refreshToken(@Request() req) {
    const user = req.user;
    const accessToken = await this.authService.getAccessToken(user);
    return { access_token: accessToken };
  }
}
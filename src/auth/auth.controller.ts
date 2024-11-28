import { Controller, Request, Post, UseGuards, Get } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Request() req: FastifyRequest) {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    return this.authService.generateTokens(req.body, metadata);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refreshToken(@Request() req: FastifyRequest) {
    const user = req.user;
    const accessToken = await this.authService.getAccessToken(user);

    await this.authService['posthogService'].capture({
      distinctId: user['userId'].toString(),
      event: 'user.token_refresh',
      properties: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    return { access_token: accessToken };
  }
}
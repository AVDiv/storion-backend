import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PosthogService } from '../analytics/posthog.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly posthogService: PosthogService,
  ) { }

  async generateTokens(user: any, metadata?: { userAgent?: string; ip?: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(user),
      this.getRefreshToken(user)
    ]);

    await this.posthogService.capture({
      distinctId: user.userId.toString(),
      event: 'user.login',
      properties: {
        username: user.username,
        userAgent: metadata?.userAgent,
        ip: metadata?.ip,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }

  async getAccessToken(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessToken.secret'),
      expiresIn: this.configService.get('jwt.accessToken.expiresIn')
    });
  }

  private async getRefreshToken(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshToken.secret'),
      expiresIn: this.configService.get('jwt.refreshToken.expiresIn')
    });
  }

  async validateUser(username: string, pass: string): Promise<any> {
    // Your existing validation logic
    const validationResult = { userId: 1, username: 'test' }; // Mock result

    if (validationResult) {
      await this.posthogService.capture({
        distinctId: validationResult.userId.toString(),
        event: 'user.login_attempt',
        properties: {
          username,
          success: true,
        },
      });
      return validationResult;
    }

    await this.posthogService.capture({
      distinctId: username,
      event: 'user.login_attempt',
      properties: {
        username,
        success: false,
      },
    });
    return null;
  }
}

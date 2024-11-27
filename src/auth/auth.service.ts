import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  async generateTokens(user: any) {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(user),
      this.getRefreshToken(user)
    ]);

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
    // Implement your user validation logic here
    // For example, check the username and password against a database
    const user = { userId: 1, username: 'test' }; // Replace with actual user validation
    if (user && user.username === username && pass === 'password') {
      return user;
    }
    return null;
  }
}

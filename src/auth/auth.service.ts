import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PosthogService } from '../analytics/posthog.service';
import { LoginEventData } from 'src/models/event/login-event-data.dto';
import { LoginGoogleUserDto } from 'src/models/user/login-google-user.dto';
import { CreateUserDto } from 'src/models/user/create-user.dto';
import { UserService } from 'src/user/user.service';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  private userPasswordSalt: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly posthogService: PosthogService,
    private userService: UserService,
  ) {
    this.userPasswordSalt = this.configService.get('userPassword.salt');
  }

  async generateTokens(
    user: any,
    metadata?: { userAgent?: string; ip?: string },
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(user),
      this.getRefreshToken(user),
    ]);

    await this.posthogService.capture({
      distinctId: user.id.toString(),
      event: 'user.login',
      properties: {
        username: user.username,
        userAgent: metadata?.userAgent,
        ip: metadata?.ip,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async getAccessToken(user: any) {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessToken.secret'),
      expiresIn: this.configService.get('jwt.accessToken.expiresIn'),
    });
  }

  private async getRefreshToken(user: any) {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshToken.secret'),
      expiresIn: this.configService.get('jwt.refreshToken.expiresIn'),
    });
  }

  async register(user: CreateUserDto, metadata: LoginEventData) {
    // Hash password
    user.password = await argon2.hash(user.password, {
      salt: Buffer.from(this.userPasswordSalt, 'base64'),
      hashLength: 32,
      type: argon2.argon2id,
    });

    // Create new user account
    const newUser: User = await this.userService.createUser(user);

    // Send user signup activity log
    await this.posthogService.capture({
      distinctId: newUser.id.toString(),
      event: 'user.signup',
      properties: {
        username: newUser.email,
        userAgent: metadata.userAgent,
        ip: metadata.ip,
      },
    });

    // Return generated JWT Tokens
    return this.generateTokens(newUser, metadata);
  }

  async validateJwtUser(username: string, pass: string): Promise<any> {
    // Your existing validation logic
    const validationResult = { id: 1, username: 'test' }; // Mock result

    if (validationResult) {
      await this.posthogService.capture({
        distinctId: validationResult.id.toString(),
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

  async handleGoogleAuth(
    googleUser: LoginGoogleUserDto,
    metadata: LoginEventData,
  ) {
    // Convert Google user to your app's user format
    const user = {
      userId: googleUser.email, // You might want to generate or lookup a proper userId
      username: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      picture: googleUser.picture,
    };

    // Generate tokens like in regular login
    return this.generateTokens(user, metadata);
  }
}

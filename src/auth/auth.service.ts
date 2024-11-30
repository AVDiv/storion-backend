import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PosthogService } from '../analytics/posthog.service';
import { LoginEventData } from 'src/models/event/login-event-data.dto';
import { LoginGoogleUserDto } from 'src/models/user/login-google-user.dto';
import { CreateUserDto } from 'src/models/user/create-user.dto';
import { UserEntity } from 'src/prisma/entities/user/user.entity';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { LoginJwtUserDto } from 'src/models/user/login-jwt-user.dto';

@Injectable()
export class AuthService {
  private userPasswordSalt: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly posthogService: PosthogService,
    private userEntity: UserEntity,
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

    if (metadata) {
      await this.posthogService.capture({
        distinctId: user.id,
        event: 'user.login',
        properties: {
          username: user.username,
          userAgent: metadata?.userAgent,
          ip: metadata?.ip,
        },
      });
    }

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
    const newUser: User = await this.userEntity.createUser(user);

    // Send user signup activity log
    await this.posthogService.capture({
      distinctId: newUser.id.toString(),
      event: 'user.signup',
      properties: {
        email: newUser.email,
        userAgent: metadata.userAgent,
        ip: metadata.ip,
      },
    });

    // Return generated JWT Tokens
    // return this.generateTokens(newUser, metadata);
    // Accounts are disabled at signup for the moment, so tokens will not be generated on the go
    return 'Account created successfully!';
  }

  async validateJwtUser(user: LoginJwtUserDto, metadata?: LoginEventData) {
    const foundUser = await this.userEntity.findUserByEmail(user.email);

    let validationResult = null;
    if (foundUser) {
      const isPasswordValid = await argon2.verify(
        foundUser.password,
        user.password,
      );

      if (isPasswordValid) {
        validationResult = foundUser;
      }
    }

    // Send login attempt activity
    if (validationResult) {
      await this.posthogService.capture({
        distinctId: validationResult.id.toString(),
        event: 'user.login_attempt',
        properties: {
          email: user.email,
          success: true,
        },
      });
      return this.generateTokens(user, metadata);
    }

    await this.posthogService.capture({
      distinctId: user.email,
      event: 'user.login_attempt',
      properties: {
        email: user.email,
        success: false,
      },
    });
    throw new NotFoundException('Account Not Found!');
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
    private userEntity: UserEntity,
  ) {
    this.userPasswordSalt = this.configService.get('userPassword.salt');
  }

  async generateTokens(
    user: User,
    metadata?: { userAgent?: string; ip?: string },
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(user),
      this.getRefreshToken(user),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async getAccessToken(user: any) {
    const payload = { username: user.email, sub: user.id };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessToken.secret'),
      expiresIn: this.configService.get('jwt.accessToken.expiresIn'),
    });
  }

  private async getRefreshToken(user: any) {
    const payload = { username: user.email, sub: user.id };
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
      return this.generateTokens(foundUser, metadata);
    }

    throw new NotFoundException('Account Not Found!');
  }

  async handleGoogleAuth(
    googleUser: LoginGoogleUserDto,
    metadata: LoginEventData,
  ) {
    // Check if user exists
    let user = await this.userEntity.findUserByEmail(googleUser.email);

    if (!user) {
      // Create new user from Google data
      user = await this.userEntity.createUser({
        email: googleUser.email,
        name: `${googleUser.firstName} ${googleUser.lastName}`,
        password: '',
      });

    }

    // Generate tokens
    return this.generateTokens(user, metadata);
  }
}

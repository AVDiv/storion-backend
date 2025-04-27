import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserEntity } from '../prisma/entities/user/user.entity';
import { NotFoundException } from '@nestjs/common/exceptions';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let mockUserEntity: { findUserByEmail: any; createUser: any };

  beforeEach(async () => {
    mockUserEntity = {
      findUserByEmail: vi.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: '$argon2id$v=19$m=16,t=2,p=1$dGVzdC1zYWx0$YUJW3F1x15IXUBj8n8ELTA', // pre-hashed "test" password
        username: 'testuser'
      }),
      createUser: vi.fn(),
    };

    const mockJwtService = {
      sign: vi.fn().mockReturnValue('test-token'),
    };

    const mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        const config = {
          'jwt.accessToken.secret': 'test-access-secret',
          'jwt.accessToken.expiresIn': '1h',
          'jwt.refreshToken.secret': 'test-refresh-secret',
          'jwt.refreshToken.expiresIn': '7d',
          'userPassword.salt': 'test-salt',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UserEntity, useValue: mockUserEntity },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should generate a JWT token', async () => {
      const user = { id: 1, username: 'testuser' };  // Changed userId to id
      const result = await service.getAccessToken(user);

      expect(result).toBe('test-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: user.username,
          sub: user.id,  // Changed user.userId to user.id
        },
        {
          secret: configService.get('jwt.accessToken.secret'),
          expiresIn: configService.get('jwt.accessToken.expiresIn'),
        },
      );
    });
  });

  describe('generateTokens', () => {
    it('should return both access and refresh tokens', async () => {
      const user = { userId: 1, username: 'test' };
      const mockAccessToken = 'test-access-token';
      const mockRefreshToken = 'test-refresh-token';

      vi.spyOn(jwtService, 'sign').mockImplementation((payload, options) => {
        return options?.secret === configService.get('jwt.refreshToken.secret')
          ? mockRefreshToken
          : mockAccessToken;
      });

      const result = await service.generateTokens(user);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.access_token).toBe(mockAccessToken);
      expect(result.refresh_token).toBe(mockRefreshToken);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateJwtUser', () => {
    it('should return generated tokens when credentials are valid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'test'
      };

      const result = await service.validateJwtUser(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should return 404 (Account Not Found!) when credentials are invalid', async () => {
      const user = { email: 'test', password: 'wrongpassword' };
      await expect(service.validateJwtUser(user)).rejects.toThrow(NotFoundException);
    });

    it('should return null when credentials are invalid', async () => {
      const user = { email: 'unknownuser', password: 'nopass' };
      await expect(service.validateJwtUser(user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleGoogleAuth', () => {
    const googleUser = {
      accessToken: 'google-access-token',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      picture: 'http://example.com/photo.jpg',
    };

    const metadata = {
      userAgent: 'test-agent',
      ip: '127.0.0.1',
    };

    it('should create new user if not exists', async () => {
      mockUserEntity.findUserByEmail.mockResolvedValueOnce(null);
      mockUserEntity.createUser.mockResolvedValueOnce({
        id: 1,
        email: googleUser.email,
        name: 'John Doe',
      });

      await service.handleGoogleAuth(googleUser, metadata);

      expect(mockUserEntity.createUser).toHaveBeenCalledWith({
        email: googleUser.email,
        name: 'John Doe',
        password: '',
      });
    });

    it('should login existing user', async () => {
      const existingUser = {
        id: 1,
        email: googleUser.email,
        name: 'John Doe',
      };
      mockUserEntity.findUserByEmail.mockResolvedValueOnce(existingUser);

      const result = await service.handleGoogleAuth(googleUser, metadata);

      expect(mockUserEntity.createUser).not.toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });
});

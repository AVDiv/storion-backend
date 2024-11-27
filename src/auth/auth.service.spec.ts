import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockJwtService = {
      sign: vi.fn().mockReturnValue('test-token'),
    };

    const mockConfigService = {
      get: vi.fn((key: string) => {
        const config = {
          'jwt.accessToken.secret': 'test-access-secret',
          'jwt.accessToken.expiresIn': '1h',
          'jwt.refreshToken.secret': 'test-refresh-secret',
          'jwt.refreshToken.expiresIn': '7d',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
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
      const user = { userId: 1, username: 'testuser' };
      const result = await service.getAccessToken(user);

      expect(result).toBe('test-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: user.username,
          sub: user.userId,
        },
        {
          secret: configService.get('jwt.accessToken.secret'),
          expiresIn: configService.get('jwt.accessToken.expiresIn'),
        }
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

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      const result = await service.validateUser('test', 'password');

      expect(result).toEqual({ userId: 1, username: 'test' });
    });

    it('should return null when credentials are invalid', async () => {
      const result = await service.validateUser('test', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});

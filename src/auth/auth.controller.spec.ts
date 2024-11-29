import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
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

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: () => 'test-token',
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('auth', () => {
    it('should return tokens on login', async () => {
      const req = {
        body: { username: 'test', password: 'password' },
      };
      const tokens = {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
      };
      const result = await authController.login(req);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });
});

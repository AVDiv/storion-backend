import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PosthogService } from '../analytics/posthog.service';
import { UserEntity } from '../prisma/entities/user/user.entity';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginJwtUserDto } from 'src/models/user/login-jwt-user.dto';
import { RequestWithUser } from 'src/models/request/request-with-user.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockJwtService = {
      sign: vi.fn().mockReturnValue('test-token'),
    };

    const mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        const config = {
          'jwt.accessToken.secret': 'test-secret',
          'jwt.accessToken.expiresIn': '1h',
        };
        return config[key];
      }),
    };

    const mockPosthogService = {
      capture: vi.fn().mockResolvedValue(undefined),
    };

    const mockUserEntity = {
      findUserByEmail: vi.fn().mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      }),
      createUser: vi.fn(),
    };

    const mockAuthService = {
      login: vi.fn().mockResolvedValue({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token'
      }),
      validateJwtUser: vi.fn().mockImplementation(async (loginJwtUserDto: LoginJwtUserDto) => ({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token'
      })),
      refreshTokens: vi.fn().mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PosthogService,
          useValue: mockPosthogService,
        },
        {
          provide: UserEntity,
          useValue: mockUserEntity,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('auth', () => {
    it('should return tokens on login', async () => {
      const req: RequestWithUser = {
        ip: '0.0.0.0',
        headers: { 'user-agent': 'test' },
        body: { username: 'test', password: 'password' }
      };
      const tokens = {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
      };
      const result = await controller.login(req, req.body);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });
});

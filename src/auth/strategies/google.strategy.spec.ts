import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(async () => {
    const mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        const config = {
          'google.clientId': 'test-client-id',
          'google.clientSecret': 'test-client-secret',
          'google.callbackUrl': 'http://localhost:3000/auth/google/callback',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user data from Google profile', async () => {
      const profile = {
        emails: [{ value: 'test@example.com' }],
        name: { givenName: 'John', familyName: 'Doe' },
        photos: [{ value: 'http://example.com/photo.jpg' }],
      };

      const done = vi.fn();
      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        accessToken: 'access-token',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        picture: 'http://example.com/photo.jpg',
      });
    });

    it('should handle missing profile data', async () => {
      const profile = {
        emails: [{ value: 'test@example.com' }],
        name: {},
        photos: [],
      };

      const done = vi.fn();
      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        accessToken: 'access-token',
        email: 'test@example.com',
        firstName: '',
        lastName: '',
        picture: '',
      });
    });

    it('should throw UnauthorizedException when no email provided', async () => {
      const profile = {
        emails: [],
        name: { givenName: 'John', familyName: 'Doe' },
      };

      const done = vi.fn();
      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(
        expect.any(UnauthorizedException),
        null,
      );
    });
  });
});
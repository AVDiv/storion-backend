import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotRegisteredValidator } from './email-not-registered.rule';
import { UserEntity } from '../../prisma/entities/user/user.entity';
import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

describe('EmailNotRegisteredValidator', () => {
  let validator: EmailNotRegisteredValidator;
  let mockUserEntity: vi.Mocked<UserEntity>;

  beforeEach(async () => {
    mockUserEntity = {
      findUserByEmail: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailNotRegisteredValidator,
        {
          provide: UserEntity,
          useValue: mockUserEntity,
        },
      ],
    }).compile();

    validator = module.get<EmailNotRegisteredValidator>(EmailNotRegisteredValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('should return true if email is not registered', async () => {
    mockUserEntity.findUserByEmail.mockResolvedValue(null);
    const result = await validator.validate('newuser@example.com');
    expect(result).toBe(true);
  });

  it('should throw ConflictException if email is already registered', async () => {
    mockUserEntity.findUserByEmail.mockResolvedValue({ id: '1', email: 'exists@example.com' } as any);
    await expect(validator.validate('exists@example.com')).rejects.toThrow(ConflictException);
  });

  it('should return false for non-string values', async () => {
    const result = await validator.validate(123);
    expect(result).toBe(false);
  });
});
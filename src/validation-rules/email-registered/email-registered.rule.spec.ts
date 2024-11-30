import { Test, TestingModule } from '@nestjs/testing';
import { EmailRegisteredValidator } from './email-registered.rule';
import { UserEntity } from '../../prisma/entities/user/user.entity';
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { vi } from 'vitest';

describe('EmailRegisteredValidator', () => {
  let validator: EmailRegisteredValidator;
  let mockUserEntity: vi.Mocked<UserEntity>;

  beforeEach(async () => {
    mockUserEntity = {
      findUserByEmail: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailRegisteredValidator,
        {
          provide: UserEntity,
          useValue: mockUserEntity,
        },
      ],
    }).compile();

    validator = module.get<EmailRegisteredValidator>(EmailRegisteredValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('should return true if email is registered', async () => {
    mockUserEntity.findUserByEmail.mockResolvedValue({ id: '1', email: 'exists@example.com' } as any);
    const result = await validator.validate('exists@example.com');
    expect(result).toBe(true);
  });

  it('should throw NotFoundException if email is not registered', async () => {
    mockUserEntity.findUserByEmail.mockResolvedValue(null);
    await expect(validator.validate('nonexistent@example.com')).rejects.toThrow(NotFoundException);
  });

  it('should return false for non-string values', async () => {
    const result = await validator.validate(123);
    expect(result).toBe(false);
  });
});
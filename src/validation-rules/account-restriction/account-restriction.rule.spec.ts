import { Test, TestingModule } from '@nestjs/testing';
import { AccountRestrictionValidator } from './account-restriction.rule';
import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { UserEntity } from 'src/prisma/entities/user/user.entity';

describe('AccountRestrictionValidator', () => {
  let validator: AccountRestrictionValidator;
  let mockUserEntity: vi.Mocked<UserEntity>;

  beforeEach(async () => {
    mockUserEntity = {
      findUserByEmail: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountRestrictionValidator,
        {
          provide: UserEntity,
          useValue: mockUserEntity,
        },
      ],
    }).compile();

    validator = module.get<AccountRestrictionValidator>(AccountRestrictionValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('should return true if account exists and is not restricted', async () => {
    mockUserEntity.findUserByEmail.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      is_banned: false,
      is_disabled: false
    } as any);
    const result = await validator.validate('user@example.com');
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if account is banned', async () => {
    mockUserEntity.findUserByEmail.mockResolvedValue({
      id: '1',
      email: 'banned@example.com',
      is_banned: true,
      is_disabled: false
    } as any);
    await expect(validator.validate('banned@example.com')).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if account is disabled', async () => {
    mockUserEntity.findUserByEmail.mockResolvedValue({
      id: '1',
      email: 'disabled@example.com',
      is_banned: false,
      is_disabled: true
    } as any);
    await expect(validator.validate('disabled@example.com')).rejects.toThrow(ForbiddenException);
  });

  it('should return true if user not found (for new registrations)', async () => {
    mockUserEntity.findUserByEmail.mockResolvedValue(null);
    const result = await validator.validate('newuser@example.com');
    expect(result).toBe(true);
  });

  it('should return false for non-string values', async () => {
    const result = await validator.validate(123);
    expect(result).toBe(false);
  });
});
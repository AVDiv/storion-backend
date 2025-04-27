import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingCompletedValidator } from './onboarding-completed.rule';
import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { UserEntity } from 'src/prisma/entities/user/user.entity';

describe('OnboardingCompletedValidator', () => {
  let validator: OnboardingCompletedValidator;
  let mockUserEntity: vi.Mocked<UserEntity>;

  beforeEach(async () => {
    mockUserEntity = {
      isOnboardingComplete: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingCompletedValidator,
        {
          provide: UserEntity,
          useValue: mockUserEntity,
        },
      ],
    }).compile();

    validator = module.get<OnboardingCompletedValidator>(OnboardingCompletedValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('should return true if user has completed onboarding', async () => {
    mockUserEntity.isOnboardingComplete.mockResolvedValue(true);
    const result = await validator.validate('user-id');
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user has not completed onboarding', async () => {
    mockUserEntity.isOnboardingComplete.mockResolvedValue(false);
    await expect(validator.validate('user-id')).rejects.toThrow(ForbiddenException);
  });

  it('should return false for non-string values', async () => {
    const result = await validator.validate(123);
    expect(result).toBe(false);
  });
});
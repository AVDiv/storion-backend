import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { UserEntity } from 'src/prisma/entities/user/user.entity';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let mockUserEntity: any;

  beforeEach(async () => {
    mockUserEntity = {
      updateOnboarding: vi.fn(),
      getOnboardingData: vi.fn(),
      isOnboardingComplete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: UserEntity,
          useValue: mockUserEntity,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateOnboarding', () => {
    it('should update onboarding data and return success response', async () => {
      const mockUserId = 'user-123';
      const mockOnboardingData = {
        description: 'I am a software developer',
        topics: ['programming', 'design', 'technology'],
        trackingConsent: true,
      };

      mockUserEntity.updateOnboarding.mockResolvedValue({
        id: mockUserId,
        ...mockOnboardingData,
        onboardingCompleted: true,
      });

      const result = await service.updateOnboarding(mockUserId, mockOnboardingData);

      expect(mockUserEntity.updateOnboarding).toHaveBeenCalledWith(mockUserId, mockOnboardingData);
      expect(result).toEqual({
        success: true,
        message: 'Onboarding completed successfully',
      });
    });
  });

  describe('getOnboardingData', () => {
    it('should return onboarding data for a user', async () => {
      const mockUserId = 'user-123';
      const mockOnboardingData = {
        description: 'I am a software developer',
        topics: ['programming', 'design', 'technology'],
        trackingConsent: true,
        completed: true,
      };

      mockUserEntity.getOnboardingData.mockResolvedValue(mockOnboardingData);

      const result = await service.getOnboardingData(mockUserId);

      expect(mockUserEntity.getOnboardingData).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockOnboardingData);
    });
  });

  describe('isOnboardingComplete', () => {
    it('should return true if onboarding is complete', async () => {
      const mockUserId = 'user-123';
      mockUserEntity.isOnboardingComplete.mockResolvedValue(true);

      const result = await service.isOnboardingComplete(mockUserId);

      expect(mockUserEntity.isOnboardingComplete).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(true);
    });

    it('should return false if onboarding is not complete', async () => {
      const mockUserId = 'user-123';
      mockUserEntity.isOnboardingComplete.mockResolvedValue(false);

      const result = await service.isOnboardingComplete(mockUserId);

      expect(mockUserEntity.isOnboardingComplete).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(false);
    });
  });
});
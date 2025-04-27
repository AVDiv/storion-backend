import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let mockOnboardingService: any;

  beforeEach(async () => {
    mockOnboardingService = {
      updateOnboarding: vi.fn(),
      getOnboardingData: vi.fn(),
      isOnboardingComplete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        {
          provide: OnboardingService,
          useValue: mockOnboardingService,
        },
      ],
    }).compile();

    controller = module.get<OnboardingController>(OnboardingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitOnboarding', () => {
    it('should submit onboarding data successfully', async () => {
      const mockUserId = 'user-123';
      const mockRequest = {
        user: { userId: mockUserId },
      };

      const mockOnboardingData = {
        description: 'I am a software developer',
        topics: ['programming', 'design', 'technology'],
        trackingConsent: true,
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding completed successfully',
      };

      mockOnboardingService.updateOnboarding.mockResolvedValue(mockResponse);

      const result = await controller.submitOnboarding(mockRequest as any, mockOnboardingData);

      expect(mockOnboardingService.updateOnboarding).toHaveBeenCalledWith(
        mockUserId,
        mockOnboardingData,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOnboardingStatus', () => {
    it('should get onboarding data successfully', async () => {
      const mockUserId = 'user-123';
      const mockRequest = {
        user: { userId: mockUserId },
      };

      const mockOnboardingData = {
        description: 'I am a software developer',
        topics: ['programming', 'design', 'technology'],
        trackingConsent: true,
        completed: true,
      };

      mockOnboardingService.getOnboardingData.mockResolvedValue(mockOnboardingData);

      const result = await controller.getOnboardingStatus(mockRequest as any);

      expect(mockOnboardingService.getOnboardingData).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockOnboardingData);
    });
  });

  describe('checkOnboardingStatus', () => {
    it('should return true when onboarding is complete', async () => {
      const mockUserId = 'user-123';
      const mockRequest = {
        user: { userId: mockUserId },
      };

      mockOnboardingService.isOnboardingComplete.mockResolvedValue(true);

      const result = await controller.checkOnboardingStatus(mockRequest as any);

      expect(mockOnboardingService.isOnboardingComplete).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({ completed: true });
    });

    it('should return false when onboarding is not complete', async () => {
      const mockUserId = 'user-123';
      const mockRequest = {
        user: { userId: mockUserId },
      };

      mockOnboardingService.isOnboardingComplete.mockResolvedValue(false);

      const result = await controller.checkOnboardingStatus(mockRequest as any);

      expect(mockOnboardingService.isOnboardingComplete).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({ completed: false });
    });
  });
});
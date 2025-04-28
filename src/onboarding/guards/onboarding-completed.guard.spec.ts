import { ForbiddenException } from '@nestjs/common';
import { OnboardingCompletedGuard } from './onboarding-completed.guard';
import { OnboardingService } from '../onboarding.service';
import { createMock } from '@golevelup/ts-vitest';
import { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

describe('OnboardingCompletedGuard', () => {
  let guard: OnboardingCompletedGuard;
  let mockOnboardingService: any;

  beforeEach(() => {
    mockOnboardingService = {
      isOnboardingComplete: vi.fn(),
    };
    guard = new OnboardingCompletedGuard(mockOnboardingService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when onboarding is complete', async () => {
      const mockExecutionContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'user-123' },
          }),
        }),
      });

      mockOnboardingService.isOnboardingComplete.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(mockOnboardingService.isOnboardingComplete).toHaveBeenCalledWith('user-123');
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when onboarding is not complete', async () => {
      const mockExecutionContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'user-123' },
          }),
        }),
      });

      mockOnboardingService.isOnboardingComplete.mockResolvedValue(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new ForbiddenException('Please complete onboarding before accessing this resource')
      );
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const mockExecutionContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            user: null,
          }),
        }),
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new ForbiddenException('Authentication required or user ID missing')
      );
    });
  });
});
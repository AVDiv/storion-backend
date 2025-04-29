import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable, Logger } from '@nestjs/common';
import { UserEntity } from 'src/prisma/entities/user/user.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class TrackingConsentValidator implements ValidatorConstraintInterface {
  private readonly logger = new Logger(TrackingConsentValidator.name);

  constructor(private readonly userEntity: UserEntity) { }

  /**
   * Validates if user has given tracking consent
   * @param userId User ID to check for tracking consent
   * @returns boolean indicating if user has given consent
   */
  async validate(userId: string, args?: ValidationArguments): Promise<boolean> {
    if (typeof userId !== 'string') return false;

    try {
      // Find user and check tracking consent
      const user = await this.userEntity.findUserById(userId);

      // If user not found, return false
      if (!user) {
        this.logger.warn(`User with ID ${userId} not found`);
        return false;
      }

      // Return tracking consent value
      return user.trackingConsent === true;
    } catch (error) {
      this.logger.error(`Error checking tracking consent: ${error.message}`, error.stack);
      return false; // Default to no consent on error for safety
    }
  }

  defaultMessage(args?: ValidationArguments): string {
    return 'User has not given tracking consent';
  }
}

/**
 * Decorator that validates if the user has given tracking consent
 * Usage: @TrackingConsent() userId: string
 */
export function TrackingConsent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: TrackingConsentValidator,
    });
  };
}

/**
 * Extended validator for service-level usage (not through decorator)
 */
@Injectable()
export class TrackingConsentService {
  constructor(private readonly validator: TrackingConsentValidator) { }

  /**
   * Check if a user has given tracking consent
   * @param userId User ID to check for tracking consent
   * @returns boolean indicating if the user has given consent
   */
  async hasTrackingConsent(userId: string): Promise<boolean> {
    return this.validator.validate(userId);
  }

  /**
   * Check if a user can have their profile created or updated during onboarding
   * This always returns true because we want to process initial preferences
   * even if tracking consent is not given
   */
  async canCreateProfile(): Promise<boolean> {
    return true;
  }
}
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserEntity } from 'src/prisma/entities/user/user.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class OnboardingCompletedValidator
  implements ValidatorConstraintInterface {
  constructor(private readonly userEntity: UserEntity) { }

  async validate(userId: string, args?: ValidationArguments) {
    if (typeof userId !== 'string') return false;

    const isCompleted = await this.userEntity.isOnboardingComplete(userId);
    if (!isCompleted) {
      throw new ForbiddenException('Onboarding must be completed first');
    }
    return true;
  }

  defaultMessage() {
    return 'User must complete onboarding before accessing this resource';
  }
}

export function OnboardingCompleted(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: OnboardingCompletedValidator,
    });
  };
}
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable, ConflictException } from '@nestjs/common';
import { UserEntity } from 'src/prisma/entities/user/user.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class EmailNotRegisteredValidator
  implements ValidatorConstraintInterface {
  constructor(private readonly userEntity: UserEntity) { }

  async validate(value: any, args?: ValidationArguments) {
    if (typeof value !== 'string') return false;
    const user = await this.userEntity.findUserByEmail(value);
    if (user) {
      throw new ConflictException('Email is already registered');
    }
    return true;
  }

  defaultMessage() {
    return 'Email $value is already registered';
  }
}

export function EmailNotRegistered(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmailNotRegisteredValidator,
    });
  };
}

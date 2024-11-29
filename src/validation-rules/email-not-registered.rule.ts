import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable, ConflictException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class EmailNotRegisteredValidator
  implements ValidatorConstraintInterface {
  constructor(private readonly userService: UserService) { }

  async validate(value: any, args?: ValidationArguments) {
    if (typeof value !== 'string') return false;
    const user = await this.userService.findUserByEmail(value);
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

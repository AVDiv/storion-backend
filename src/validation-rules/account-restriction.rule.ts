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
export class AccountRestrictionValidator
  implements ValidatorConstraintInterface {
  constructor(private readonly userEntity: UserEntity) { }

  async validate(value: any, args?: ValidationArguments) {
    if (typeof value !== 'string') return false;
    const user = await this.userEntity.findUserByEmail(value);
    if (!user) return true;

    if (user.is_banned) {
      throw new ForbiddenException('This account has been banned');
    }
    if (user.is_disabled) {
      throw new ForbiddenException('This account has been disabled');
    }
    return true;
  }

  defaultMessage() {
    return 'Account access is restricted';
  }
}

export function AccountNotRestricted(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: AccountRestrictionValidator,
    });
  };
}

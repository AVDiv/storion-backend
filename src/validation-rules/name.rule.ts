import {
  buildMessage,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

function isName(value: any) {
  const regex = /^[A-Za-z\s]+$/;
  const minLength = 2;
  return typeof value == 'string' && value.length >= minLength && regex.test(value);
}

export function IsName(validationOptions?: ValidationOptions) {
  return ValidateBy({
    name: 'isName',
    validator: {
      validate: function (value, args) { return isName(value); },
      defaultMessage: buildMessage(function (eachPrefix) { return eachPrefix + '$property must be a valid name'; }, validationOptions),
    }
  }, validationOptions);
}
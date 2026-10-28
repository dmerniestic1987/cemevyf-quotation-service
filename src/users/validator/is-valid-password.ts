import { registerDecorator, ValidationOptions } from 'class-validator';

export const MIN_PASSWORD_LENGTH = 12;
// bcrypt silently ignores everything after the first 72 bytes, so longer passwords are rejected instead of truncated
export const MAX_PASSWORD_BYTES = 72;

export const isValidPassword = (value: unknown): boolean =>
  typeof value === 'string' &&
  value.length >= MIN_PASSWORD_LENGTH &&
  Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES;

export const IsValidPassword = (validationOptions?: ValidationOptions) => (object: object, propertyName: string) =>
  registerDecorator({
    name: 'isValidPassword',
    target: object.constructor,
    propertyName,
    options: {
      message: `${propertyName} must have at least ${MIN_PASSWORD_LENGTH} characters and at most ${MAX_PASSWORD_BYTES} bytes`,
      ...validationOptions,
    },
    validator: { validate: isValidPassword },
  });

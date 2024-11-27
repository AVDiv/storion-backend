import { registerAs } from '@nestjs/config';

export const userPasswordConfig = registerAs('userPassword', () => ({
  salt: process.env.USER_PASSWORD_SALT,
  saltIterations: parseInt(process.env.USER_PASSWORD_SALT_ITERATIONS || '1000', 10),
  hashingAlgorithm: process.env.USER_PASSWORD_HASHING_ALGORITHM || 'sha512',
  hashKeylen: parseInt(process.env.USER_PASSWORD_HASH_KEYLEN || '64', 10),
}));
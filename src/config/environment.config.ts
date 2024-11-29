import { registerAs } from '@nestjs/config';

export const environmentConfig = registerAs('environment', () => ({
  environment: process.env.ENVIRONMENT || 'development',
}));

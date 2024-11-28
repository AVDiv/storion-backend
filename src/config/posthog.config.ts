
import { registerAs } from '@nestjs/config';

export const posthogConfig = registerAs('posthog', () => ({
  apiKey: process.env.POSTHOG_API_KEY || '',
  host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
  enabled: process.env.POSTHOG_ENABLED === 'true',
}));
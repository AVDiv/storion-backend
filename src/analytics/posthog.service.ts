
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

@Injectable()
export class PosthogService implements OnModuleDestroy {
  private client: PostHog;

  constructor(private configService: ConfigService) {
    this.client = new PostHog(
      this.configService.get('posthog.apiKey'),
      { host: this.configService.get('posthog.host') }
    );
  }

  async capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, any>;
  }) {
    if (!this.configService.get('posthog.enabled')) {
      return;
    }

    await this.client.capture({
      distinctId: params.distinctId,
      event: params.event,
      properties: params.properties,
    });
  }

  async identify(params: {
    distinctId: string;
    properties?: Record<string, any>;
  }) {
    if (!this.configService.get('posthog.enabled')) {
      return;
    }

    await this.client.identify({
      distinctId: params.distinctId,
      properties: params.properties,
    });
  }

  onModuleDestroy() {
    this.client.shutdown();
  }
}
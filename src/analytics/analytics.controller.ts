import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { BatchPostHogWebhookDto, PostHogEventDto, PostHogWebhookDto } from './dto/posthog-webhook.dto';

@Controller('events')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) { }

  /**
   * Endpoint to handle PostHog webhook data
   * Supports both single event and batch event payloads
   */
  @Post()
  @HttpCode(200)
  async receiveEvents(@Body() payload: any) {
    this.logger.log('Received PostHog webhook data');

    try {
      // Handle different payload formats
      if (Array.isArray(payload)) {
        // Array of events
        const events = payload as PostHogEventDto[];
        const result = await this.analyticsService.processEvents(events);

        return {
          success: true,
          message: 'Events batch processed',
          ...result
        };
      } else if (payload.event) {
        // Single webhook payload with event object
        const webhookData = payload as PostHogWebhookDto;
        const result = await this.analyticsService.processWebhook(webhookData);

        return {
          success: result,
          message: result ? 'Event processed successfully' : 'Event processing skipped',
        };
      } else if (payload.events && Array.isArray(payload.events)) {
        // Batch webhook payload with events array
        const batchData = payload as BatchPostHogWebhookDto;
        const result = await this.analyticsService.processEvents(batchData.events);

        return {
          success: true,
          message: 'Events batch processed',
          ...result
        };
      } else {
        // Unknown payload format
        this.logger.warn('Received unknown payload format');
        return {
          success: false,
          message: 'Invalid payload format',
        };
      }
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error processing webhook: ${error.message}`,
      };
    }
  }
}
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/config.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [AuthModule, AppConfigModule, AnalyticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

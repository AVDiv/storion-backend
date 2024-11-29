import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/config.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ValidationRulesModule } from './validation-rules/validation-rules.module';

@Module({
  imports: [
    AuthModule,
    AppConfigModule,
    AnalyticsModule,
    PrismaModule,
    UserModule,
    ValidationRulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

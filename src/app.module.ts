import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/config.module';

@Module({
  imports: [AuthModule, AppConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

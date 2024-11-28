import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentConfig } from './environment.config';
import { jwtConfig } from './jwt.config';
import { userPasswordConfig } from './user-password.config';
import { posthogConfig } from './posthog.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // This makes ConfigModule available throughout the application
      load: [
        environmentConfig,
        jwtConfig,
        userPasswordConfig,
        posthogConfig
      ],
    }),
  ],
})
export class AppConfigModule { }
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './prisma/entities/user/user.module';
import { ValidationRulesModule } from './validation-rules/validation-rules.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { SearchModule } from './search/search.module';
import { DataModule } from './data/data.module';

@Module({
  imports: [
    AuthModule,
    AppConfigModule,
    PrismaModule,
    UserModule,
    ValidationRulesModule,
    OnboardingModule,
    Neo4jModule,
    SearchModule,
    DataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

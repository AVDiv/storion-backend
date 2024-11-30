import { Module } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserEntity],
  exports: [UserEntity],
})
export class UserModule { }

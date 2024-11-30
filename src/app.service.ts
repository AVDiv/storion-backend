import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from './prisma/entities/user/user.entity';
import { UserProfileDto } from './models/user/user-profile.dto';

@Injectable()
export class AppService {
  constructor(private readonly userEntity: UserEntity) { }

  getPing() {
    return { status: 'OK', time: new Date().toISOString() };
  }

  async getUserProfile(email: string) {
    const result = await this.userEntity.findUserByEmail(email);
    let userProfile: UserProfileDto = new UserProfileDto();
    if (!result) {
      throw new NotFoundException('User not found',);
    }
    userProfile.name = result.name;
    userProfile.email = result.email;
    return userProfile;
  }
}

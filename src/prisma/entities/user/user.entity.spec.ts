import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from './user.entity';

describe('UserEntity', () => {
  let service: UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserEntity],
    }).compile();

    service = module.get<UserEntity>(UserEntity);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

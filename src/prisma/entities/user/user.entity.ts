import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from 'src/models/user/create-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UserEntity {
  constructor(private prisma: PrismaService) { }

  /**
   * Creates a user account
   *
   * @param {CreateUserDto} data
   * @return {User}
   * @memberof UserEntity
   * @example
   *
   * // Create a user account
   * const user = await userEntity.createUser({
   *  name: "User's name",
   *  email: "User's email",
   *  password: "User's password"
   * })
   */
  async createUser(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findAllUsers() {
    return this.prisma.user.findMany();
  }

  async findUserById(id: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Returns a user filtered by email
   *
   * @param {string} email - User's email
   * @return {User}
   * @memberof UserEntity
   * @example
   *
   * // Get a user by email
   * const user = await userEntity.findUserByEmail('email');
   *
   */
  async findUserByEmail(email: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }
}

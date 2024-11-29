import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from 'src/models/user/create-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UserService {

  ;
  constructor(
    private prisma: PrismaService
  ) { }

  /**
   * Creates a user account
   *
   * @param {CreateUserDto} data
   * @return {User} 
   * @memberof UserService
   * @example
   * 
   * // Create a user account
   * const user = await userService.createUser({
   *  name: "User's name",
   *  email: "User's email",
   *  password: "User's password"
   * })
   */
  async createUser(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }

  async findAllUsers() {
    return this.prisma.user.findMany();
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Returns a user filtered by email
   *
   * @param {string} email - User's email
   * @return {User} 
   * @memberof UserService
   * @example
   * 
   * // Get a user by email
   * const user = await userService.findUserByEmail('email');
   * 
   */
  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }
}

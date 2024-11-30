import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from 'src/models/user/create-user.dto';
import { User } from '@prisma/client';

/**
 * Entity class for handling user-related database operations
 * 
 * @export
 * @class UserEntity
 * @description
 * Provides methods for creating, reading, and managing user accounts in the database.
 * Uses PrismaService to interact with the database layer.
 */
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

  /**
   * Returns all users in the database
   * 
   * @return {Promise<User[]>} Array of all users
   * @memberof UserEntity
   * @example
   * 
   * // Get all users
   * const users = await userEntity.getAllUsers();
   */
  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  /**
   * Returns a user filtered by their ID
   *
   * @param {string} id - User's unique identifier
   * @return {Promise<User>} User with matching ID
   * @memberof UserEntity
   * @example
   *
   * // Get a user by ID
   * const user = await userEntity.findUserById('user-id');
   */
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

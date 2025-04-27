import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from 'src/models/user/create-user.dto';
import { User } from '@prisma/client';
import { OnboardingUserDto } from 'src/models/user/onboarding-user.dto';

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

  /**
   * Updates a user's onboarding information
   * 
   * @param {string} userId - User's unique identifier
   * @param {OnboardingUserDto} data - Onboarding data to update
   * @return {Promise<User>} Updated user
   * @memberof UserEntity
   * @example
   * 
   * // Update onboarding for a user
   * const user = await userEntity.updateOnboarding('user-id', onboardingData);
   */
  async updateOnboarding(userId: string, data: OnboardingUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        onboardingCompleted: true
      }
    });
  }

  /**
   * Checks if a user has completed the onboarding process
   * 
   * @param {string} userId - User's unique identifier
   * @return {Promise<boolean>} Whether onboarding is completed
   * @memberof UserEntity
   * @example
   * 
   * // Check if onboarding is complete
   * const isComplete = await userEntity.isOnboardingComplete('user-id');
   */
  async isOnboardingComplete(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true }
    });

    return user?.onboardingCompleted || false;
  }

  /**
   * Gets a user's onboarding information
   * 
   * @param {string} userId - User's unique identifier
   * @return {Promise<Partial<OnboardingUserDto> & { completed: boolean }>} Onboarding data
   * @memberof UserEntity
   * @example
   * 
   * // Get onboarding data
   * const onboardingData = await userEntity.getOnboardingData('user-id');
   */
  async getOnboardingData(userId: string): Promise<Partial<OnboardingUserDto> & { completed: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        description: true,
        topics: true,
        trackingConsent: true,
        onboardingCompleted: true
      }
    });

    if (!user) {
      return { completed: false, topics: [], trackingConsent: false };
    }

    return {
      description: user.description,
      topics: user.topics,
      trackingConsent: user.trackingConsent,
      completed: user.onboardingCompleted
    };
  }
}

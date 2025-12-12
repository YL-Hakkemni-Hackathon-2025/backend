import { UserModel, User } from '@hakkemni/models';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserSummaryDto
} from '@hakkemni/dto';
import { NotFoundError } from '@hakkemni/common';

export class UserService {
  /**
   * Create a new user from Lebanese ID data
   */
  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await UserModel.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      governmentId: dto.governmentId,
      dateOfBirth: dto.dateOfBirth,
      birthPlace: dto.birthPlace,
      dadName: dto.dadName,
      momFullName: dto.momFullName,
      gender: dto.gender,
      phoneNumber: dto.phoneNumber,
      email: dto.email
    });

    return this.toResponseDto(user);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.toResponseDto(user);
  }

  /**
   * Find user by government ID
   */
  async findByGovernmentId(governmentId: string): Promise<UserResponseDto | null> {
    const user = await UserModel.findOne({ governmentId });
    if (!user) {
      return null;
    }
    return this.toResponseDto(user);
  }

  /**
   * Update user
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.toResponseDto(user);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { lastLoginAt: new Date() }
    });
  }

  /**
   * Get user summary (for health pass)
   */
  async getSummary(id: string): Promise<UserSummaryDto> {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return {
      id: user._id.toString(),
      fullName: `${user.firstName} ${user.lastName}`,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender
    };
  }

  /**
   * Convert User document to response DTO
   */
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      governmentId: user.governmentId,
      dateOfBirth: user.dateOfBirth,
      birthPlace: user.birthPlace,
      dadName: user.dadName,
      momFullName: user.momFullName,
      gender: user.gender,
      phoneNumber: user.phoneNumber,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export const userService = new UserService();


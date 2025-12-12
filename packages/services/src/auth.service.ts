import jwt from 'jsonwebtoken';
import { UserModel } from '@hakkemni/models';
import {
  AuthTokenResponseDto,
  LoginResponseDto,
  CreateUserDto
} from '@hakkemni/dto';
import { LebanesIdData, UnauthorizedError, parseDateString } from '@hakkemni/common';
import { userService } from './user.service';
import { lebaneseIdService } from './lebanese-id.service';

const JWT_SECRET = process.env.JWT_SECRET || 'hakkemni-secret-key-change-in-production';

export class AuthService {
  /**
   * Authenticate user with Lebanese ID image
   */
  async authenticateWithLebanesId(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<LoginResponseDto> {
    // Process the ID image with Google Document AI
    const idData = await lebaneseIdService.processLebanesId(imageBase64, mimeType);
    return this.processIdData(idData);
  }

  /**
   * Authenticate user with Lebanese ID image from file buffer
   */
  async authenticateWithLebanesIdFromBuffer(fileBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<LoginResponseDto> {
    // Process the ID image with Google Document AI
    const idData = await lebaneseIdService.processLebanesIdFromBuffer(fileBuffer, mimeType);
    return this.processIdData(idData);
  }

  /**
   * Process extracted ID data and authenticate/register user
   */
  private async processIdData(idData: LebanesIdData): Promise<LoginResponseDto> {
    // Check if user exists
    const existingUser = await userService.findByGovernmentId(idData.government_id);

    if (existingUser) {
      // User exists - login
      await userService.updateLastLogin(existingUser.id);
      const tokens = this.generateTokens(existingUser.id, existingUser.fullName, existingUser.governmentId);

      return {
        isNewUser: false,
        user: {
          id: existingUser.id,
          fullName: existingUser.fullName
        },
        token: tokens
      };
    } else {
      // New user - create account
      const dateOfBirth = parseDateString(idData.date_of_birth);

      const createUserDto: CreateUserDto = {
        firstName: idData.first_name,
        lastName: idData.last_name,
        governmentId: idData.government_id,
        dateOfBirth: dateOfBirth || new Date(),
        birthPlace: idData.birth_place,
        dadName: idData.dad_name,
        momFullName: idData.mom_full_name
      };

      const newUser = await userService.create(createUserDto);
      const tokens = this.generateTokens(newUser.id, newUser.fullName, newUser.governmentId);

      return {
        isNewUser: true,
        user: {
          id: newUser.id,
          fullName: newUser.fullName
        },
        extractedData: idData,
        token: tokens
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokenResponseDto> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        userId: string;
        fullName: string;
        governmentId: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Verify user still exists
      const user = await userService.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return this.generateTokens(user.id, user.fullName, user.governmentId);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Verify access token
   */
  verifyToken(token: string): { userId: string; fullName: string; governmentId: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        fullName: string;
        governmentId: string;
        type: string;
      };

      if (decoded.type !== 'access') {
        throw new UnauthorizedError('Invalid access token');
      }

      return {
        userId: decoded.userId,
        fullName: decoded.fullName,
        governmentId: decoded.governmentId
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(userId: string, fullName: string, governmentId: string): AuthTokenResponseDto {
    const accessToken = jwt.sign(
      { userId, fullName, governmentId, type: 'access' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId, fullName, governmentId, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      user: {
        id: userId,
        fullName,
        governmentId
      }
    };
  }
}

export const authService = new AuthService();

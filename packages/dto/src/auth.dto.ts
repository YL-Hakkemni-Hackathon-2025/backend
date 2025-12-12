import { IsString, IsNotEmpty } from 'class-validator';
import { LebanesIdData } from '@hakkemni/common';

// Request DTOs
export class VerifyLebanesIdDto {
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;
}

// Alias for simpler naming
export class VerifyIdDto extends VerifyLebanesIdDto {}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LoginDto {
  @IsString()
  governmentId!: string;
}

// Response DTOs
export class LebanesIdVerificationResponseDto {
  success!: boolean;
  data?: LebanesIdData;
  error?: string;
}

export class AuthTokenResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  user!: {
    id: string;
    fullName: string;
    governmentId: string;
  };
}

export class LoginResponseDto {
  isNewUser!: boolean;
  user?: {
    id: string;
    fullName: string;
  };
  extractedData?: LebanesIdData;
  token?: AuthTokenResponseDto;
}

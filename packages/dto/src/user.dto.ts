import { IsString, IsOptional, IsEmail, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@hakkemni/common';
import {MedicalConditionResponseDto} from "./medical-condition.dto";
import {MedicationResponseDto} from "./medication.dto";
import {AllergyResponseDto} from "./allergy.dto";
import {LifestyleResponseDto} from "./lifestyle.dto";
import {DocumentResponseDto} from "./document.dto";

// Request DTOs
export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  governmentId!: string;

  @IsDate()
  @Type(() => Date)
  dateOfBirth!: Date;

  @IsString()
  birthPlace!: string;

  @IsString()
  dadName!: string;

  @IsString()
  momFullName!: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}

// Response DTOs
export class UserResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  fullName!: string;
  governmentId!: string;
  dateOfBirth!: Date;
  birthPlace!: string;
  dadName!: string;
  momFullName!: string;
  gender?: Gender;
  phoneNumber?: string;
  email?: string;
  profileImageUrl?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class UserSummaryDto {
  id!: string;
  fullName!: string;
  dateOfBirth!: Date;
  gender?: Gender;
}

export class UserFullSummaryDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  fullName!: string;
  governmentId!: string;
  dateOfBirth!: Date;
  birthPlace!: string;
  gender?: Gender;
  medicalConditions!: MedicalConditionResponseDto[];
  medications!: MedicationResponseDto[];
  allergies!: AllergyResponseDto[];
  lifestyles!: LifestyleResponseDto[];
  documents!: DocumentResponseDto[];
}


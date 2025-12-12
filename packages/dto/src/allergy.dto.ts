import { IsString, IsOptional, IsDate, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening'
}

export enum AllergyType {
  DRUG = 'drug',
  FOOD = 'food',
  ENVIRONMENTAL = 'environmental',
  INSECT = 'insect',
  LATEX = 'latex',
  OTHER = 'other'
}

// Request DTOs
export class CreateAllergyDto {
  @IsString()
  allergen!: string;

  @IsEnum(AllergyType)
  type!: AllergyType;

  @IsOptional()
  @IsEnum(AllergySeverity)
  severity?: AllergySeverity;

  @IsOptional()
  @IsString()
  reaction?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  diagnosedDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAllergyDto {
  @IsOptional()
  @IsString()
  allergen?: string;

  @IsOptional()
  @IsEnum(AllergyType)
  type?: AllergyType;

  @IsOptional()
  @IsEnum(AllergySeverity)
  severity?: AllergySeverity;

  @IsOptional()
  @IsString()
  reaction?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  diagnosedDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Response DTOs
export class AllergyResponseDto {
  id!: string;
  userId!: string;
  allergen!: string;
  type!: AllergyType;
  severity?: AllergySeverity;
  reaction?: string;
  diagnosedDate?: Date;
  notes?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class AllergySummaryDto {
  id!: string;
  allergen!: string;
  type!: AllergyType;
  severity?: AllergySeverity;
}


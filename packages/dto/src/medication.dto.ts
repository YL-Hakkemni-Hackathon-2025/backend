import { IsString, IsOptional, IsDate, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MedicationFrequency } from '@hakkemni/common';

// Request DTOs
export class CreateMedicationDto {
  @IsString()
  medicationName!: string;

  @IsString()
  dosageAmount!: string;

  @IsEnum(MedicationFrequency)
  frequency!: MedicationFrequency;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMedicationDto {
  @IsOptional()
  @IsString()
  medicationName?: string;

  @IsOptional()
  @IsString()
  dosageAmount?: string;

  @IsOptional()
  @IsEnum(MedicationFrequency)
  frequency?: MedicationFrequency;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Response DTOs
export class MedicationResponseDto {
  id!: string;
  userId!: string;
  medicationName!: string;
  dosageAmount!: string;
  frequency!: MedicationFrequency;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class MedicationSummaryDto {
  id!: string;
  medicationName!: string;
  dosageAmount!: string;
  frequency!: MedicationFrequency;
  notes?: string;
  aiRecommendation?: string;
}


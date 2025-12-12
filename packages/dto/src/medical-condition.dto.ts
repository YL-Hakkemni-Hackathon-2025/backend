import { IsString, IsOptional, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// Request DTOs
export class CreateMedicalConditionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  diagnosedDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMedicalConditionDto {
  @IsOptional()
  @IsString()
  name?: string;

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
export class MedicalConditionResponseDto {
  id!: string;
  userId!: string;
  name!: string;
  diagnosedDate?: Date;
  notes?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class MedicalConditionSummaryDto {
  id!: string;
  name!: string;
  diagnosedDate?: Date;
}


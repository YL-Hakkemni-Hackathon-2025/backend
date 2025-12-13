import { IsString, IsOptional, IsDate, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { LifestyleCategory } from '@hakkemni/common';

// Request DTOs
export class CreateLifestyleDto {
  @IsEnum(LifestyleCategory)
  category!: LifestyleCategory;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLifestyleDto {
  @IsOptional()
  @IsEnum(LifestyleCategory)
  category?: LifestyleCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Response DTOs
export class LifestyleResponseDto {
  id!: string;
  userId!: string;
  category!: LifestyleCategory;
  description!: string;
  frequency?: string;
  startDate?: Date;
  notes?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class LifestyleSummaryDto {
  id!: string;
  category!: LifestyleCategory;
  description!: string;
  frequency?: string;
  aiRecommendation?: string;
}


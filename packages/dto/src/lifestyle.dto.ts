import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LifestyleCategory, HabitFrequency } from '@hakkemni/common';

// Habit DTOs
export class HabitDto {
  @IsEnum(LifestyleCategory)
  category!: LifestyleCategory;

  @IsEnum(HabitFrequency)
  frequency!: HabitFrequency;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Request DTOs
export class UpdateLifestyleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabitDto)
  habits!: HabitDto[];
}

// Response DTOs
export class HabitResponseDto {
  category!: LifestyleCategory;
  frequency!: HabitFrequency;
  notes?: string;
}

export class LifestyleResponseDto {
  id!: string;
  userId!: string;
  habits!: HabitResponseDto[];
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

// Summary for health pass - individual habit summary
export class HabitSummaryDto {
  category!: LifestyleCategory;
  frequency!: HabitFrequency;
  notes?: string;
  aiRecommendation?: string;
  isToggled?: boolean;
}

// Overall lifestyle summary for health pass
export class LifestyleSummaryDto {
  id!: string;
  habits!: HabitSummaryDto[];
}

// Deprecated - keeping for backward compatibility during migration
export class CreateLifestyleDto {
  @IsEnum(LifestyleCategory)
  category!: LifestyleCategory;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  frequency?: string;
}

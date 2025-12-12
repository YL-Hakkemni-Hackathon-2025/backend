import { IsString, IsOptional, IsDate, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentSpecialty, HealthPassStatus, HealthPassDataToggles } from '@hakkemni/common';
import { MedicalConditionSummaryDto } from './medical-condition.dto';
import { MedicationSummaryDto } from './medication.dto';
import { AllergySummaryDto } from './allergy.dto';
import { LifestyleSummaryDto } from './lifestyle.dto';
import { DocumentSummaryDto } from './document.dto';

// Request DTOs
export class DataTogglesDto implements Partial<HealthPassDataToggles> {
  @IsOptional()
  @IsBoolean()
  medicalConditions?: boolean;

  @IsOptional()
  @IsBoolean()
  medications?: boolean;

  @IsOptional()
  @IsBoolean()
  allergies?: boolean;

  @IsOptional()
  @IsBoolean()
  lifestyleChoices?: boolean;

  @IsOptional()
  @IsBoolean()
  documents?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificConditions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificMedications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificAllergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificDocuments?: string[];
}

export class CreateHealthPassDto {
  @IsEnum(AppointmentSpecialty)
  appointmentSpecialty!: AppointmentSpecialty;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  appointmentDate?: Date;

  @IsOptional()
  @IsString()
  appointmentNotes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataTogglesDto)
  dataToggles?: DataTogglesDto;
}

export class UpdateHealthPassDto {
  @IsOptional()
  @IsEnum(AppointmentSpecialty)
  appointmentSpecialty?: AppointmentSpecialty;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  appointmentDate?: Date;

  @IsOptional()
  @IsString()
  appointmentNotes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataTogglesDto)
  dataToggles?: DataTogglesDto;

  @IsOptional()
  @IsEnum(HealthPassStatus)
  status?: HealthPassStatus;
}

// Response DTOs
export class HealthPassResponseDto {
  id!: string;
  userId!: string;
  appointmentSpecialty!: AppointmentSpecialty;
  appointmentDate?: Date;
  appointmentNotes?: string;
  qrCode!: string;
  accessCode!: string;
  status!: HealthPassStatus;
  dataToggles!: HealthPassDataToggles;
  aiRecommendations?: string;
  aiSuggestedToggles?: string[];
  expiresAt!: Date;
  lastAccessedAt?: Date;
  accessCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class HealthPassPreviewDto {
  // Required fields (always visible)
  patientName!: string;
  dateOfBirth!: Date;
  gender?: string;

  // Optional fields based on toggles
  medicalConditions?: MedicalConditionSummaryDto[];
  medications?: MedicationSummaryDto[];
  allergies?: AllergySummaryDto[];
  lifestyleChoices?: LifestyleSummaryDto[];
  documents?: DocumentSummaryDto[];

  // Appointment info
  appointmentSpecialty!: AppointmentSpecialty;
  appointmentDate?: Date;
  appointmentNotes?: string;

  // AI recommendations
  aiRecommendations?: string;
}

export class HealthPassSummaryDto {
  id!: string;
  appointmentSpecialty!: AppointmentSpecialty;
  appointmentDate?: Date;
  status!: HealthPassStatus;
  expiresAt!: Date;
  createdAt!: Date;
}

export class AiHealthPassSuggestionsDto {
  suggestedToggles!: {
    medicalConditions: boolean;
    medications: boolean;
    allergies: boolean;
    lifestyleChoices: boolean;
    documents: boolean;
    specificConditions: string[];
    specificMedications: string[];
    specificAllergies: string[];
    specificDocuments: string[];
  };
  recommendations!: string;
  reasoning!: string;
}

export class QrCodeDataDto {
  accessCode!: string;
  accessUrl!: string;
  expiresAt!: Date;
}


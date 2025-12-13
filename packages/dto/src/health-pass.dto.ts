import { IsString, IsOptional, IsDate, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentSpecialty, HealthPassStatus, HealthPassDataToggles } from '@hakkemni/common';
import { MedicalConditionResponseDto, MedicalConditionSummaryDto } from './medical-condition.dto';
import { MedicationResponseDto, MedicationSummaryDto } from './medication.dto';
import { AllergyResponseDto, AllergySummaryDto } from './allergy.dto';
import { LifestyleResponseDto, LifestyleSummaryDto } from './lifestyle.dto';
import { DocumentResponseDto, DocumentSummaryDto } from './document.dto';

// Health pass item with toggle and AI recommendation
export class HealthPassItemDto<T> {
  data!: T;
  isRelevant!: boolean;
  aiRecommendation!: string;
}

export class HealthPassMedicalConditionItemDto extends HealthPassItemDto<MedicalConditionResponseDto> {}
export class HealthPassMedicationItemDto extends HealthPassItemDto<MedicationResponseDto> {}
export class HealthPassAllergyItemDto extends HealthPassItemDto<AllergyResponseDto> {}
export class HealthPassLifestyleItemDto extends HealthPassItemDto<LifestyleResponseDto> {}
export class HealthPassDocumentItemDto extends HealthPassItemDto<DocumentResponseDto> {}

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

  // Populated health data with toggles and AI recommendations
  medicalConditions!: HealthPassMedicalConditionItemDto[];
  medications!: HealthPassMedicationItemDto[];
  allergies!: HealthPassAllergyItemDto[];
  lifestyles!: HealthPassLifestyleItemDto[];
  documents!: HealthPassDocumentItemDto[];

  // Overall AI recommendation
  aiRecommendations?: string;

  // AI-generated profile summary based on toggled items, age, and patient info
  aiProfileSummary?: string;

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

// AI-generated item recommendation
export class AiItemRecommendationDto {
  id!: string;
  isRelevant!: boolean;
  recommendation!: string;
}

export class AiHealthPassSuggestionsDto {
  // Individual item recommendations with IDs and explanations
  conditionRecommendations!: AiItemRecommendationDto[];
  medicationRecommendations!: AiItemRecommendationDto[];
  allergyRecommendations!: AiItemRecommendationDto[];
  lifestyleRecommendations!: AiItemRecommendationDto[];
  documentRecommendations!: AiItemRecommendationDto[];

  // Overall recommendation message
  overallRecommendation!: string;
}

export class QrCodeDataDto {
  accessCode!: string;
  accessUrl!: string;
  expiresAt!: Date;
}

// DTO for toggling a specific item
export enum HealthPassItemType {
  MEDICAL_CONDITION = 'medicalCondition',
  MEDICATION = 'medication',
  ALLERGY = 'allergy',
  LIFESTYLE = 'lifestyle',
  DOCUMENT = 'document'
}

export class ToggleHealthPassItemDto {
  @IsEnum(HealthPassItemType)
  itemType!: HealthPassItemType;

  @IsString()
  itemId!: string;

  @IsBoolean()
  isEnabled!: boolean;
}


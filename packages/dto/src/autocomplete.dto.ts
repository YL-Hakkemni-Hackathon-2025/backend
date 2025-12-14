import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MedicationFrequency } from '@hakkemni/common';

// Enum for autocomplete types
export enum AutocompleteType {
  MEDICAL_CONDITION = 'medical_condition',
  MEDICATION = 'medication',
  ALLERGY = 'allergy'
}

// Request DTO for autocomplete
export class AutocompleteRequestDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  context?: string;
}

// Response DTOs
export class AutocompleteSuggestionDto {
  name!: string;
  description?: string;
  category?: string;
  icdCode?: string; // For medical conditions
  rxcui?: string; // For medications
  commonName?: string; // Alternative names
}

export class MedicalConditionSuggestionDto {
  name!: string;
  description?: string;
  category?: string;
  icdCode?: string;
  synonyms?: string[];
}

export class MedicationSuggestionDto {
  name!: string;
  genericName?: string;
  brandNames?: string[];
  drugClass?: string;
  commonDosages?: string[];
  forms?: string[]; // tablet, capsule, injection, etc.
}

export class AllergySuggestionDto {
  name!: string;
  type!: string; // drug, food, environmental, etc.
  commonReactions?: string[];
  crossReactivities?: string[];
}

// Combined response for autocomplete endpoints
export class AutocompleteResponseDto<T> {
  suggestions!: T[];
  query!: string;
  hasMore!: boolean;
}

export class MedicalConditionAutocompleteResponseDto {
  suggestions!: MedicalConditionSuggestionDto[];
  query!: string;
  hasMore!: boolean;
}

export class MedicationAutocompleteResponseDto {
  suggestions!: MedicationSuggestionDto[];
  query!: string;
  hasMore!: boolean;
}

export class AllergyAutocompleteResponseDto {
  suggestions!: AllergySuggestionDto[];
  query!: string;
  hasMore!: boolean;
}

// Medicine Photo Scan DTOs (uses multipart/form-data upload, no request DTO needed)

export class MedicinePhotoScanResultDto {
  medicationName!: string;
  genericName?: string;
  brandName?: string;
  dosageAmount?: string;
  frequency?: MedicationFrequency;
  form?: string; // tablet, capsule, syrup, etc.
  strength?: string; // e.g., "500mg", "10mg/5ml"
  manufacturer?: string;
  activeIngredients?: string[];
  instructions?: string;
  warnings?: string[];
  expiryDate?: string;
  confidence!: number; // 0-1 confidence score
  notes?: string; // Any additional extracted information
}

export class MedicinePhotoScanResponseDto {
  success!: boolean;
  data?: MedicinePhotoScanResultDto;
  error?: string;
  rawExtractedText?: string; // For debugging
}



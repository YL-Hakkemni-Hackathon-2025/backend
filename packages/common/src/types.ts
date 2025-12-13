// Common Types

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum MedicationFrequency {
  ONCE_DAILY = 'once_daily',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  AS_NEEDED = 'as_needed',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  OTHER = 'other'
}

export enum DocumentType {
  LAB_REPORT = 'lab_report',
  MRI_SCAN = 'mri_scan',
  CT_SCAN = 'ct_scan',
  X_RAY = 'x_ray',
  PRESCRIPTION = 'prescription',
  MEDICAL_REPORT = 'medical_report',
  VACCINATION_RECORD = 'vaccination_record',
  OTHER = 'other'
}

export enum HealthPassStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  SHARED = 'shared',
  EXPIRED = 'expired'
}

export enum AppointmentSpecialty {
  GASTROENTEROLOGY = 'gastroenterology',
  ORTHOPEDICS = 'orthopedics',
  CARDIOLOGY = 'cardiology',
  DERMATOLOGY = 'dermatology',
  NEUROLOGY = 'neurology',
  OPHTHALMOLOGY = 'ophthalmology',
  PEDIATRICS = 'pediatrics',
  PSYCHIATRY = 'psychiatry',
  RADIOLOGY = 'radiology',
  UROLOGY = 'urology',
  GYNECOLOGY = 'gynecology',
  ONCOLOGY = 'oncology',
  PULMONOLOGY = 'pulmonology',
  RHEUMATOLOGY = 'rheumatology',
  ENDOCRINOLOGY = 'endocrinology',
  NEPHROLOGY = 'nephrology',
  GENERAL_PRACTICE = 'general_practice',
  EMERGENCY = 'emergency',
  OTHER = 'other'
}

export enum LifestyleCategory {
  SMOKING = 'smoking',
  ALCOHOL = 'alcohol',
  EXERCISE = 'exercise',
  DIET = 'diet',
  SLEEP = 'sleep',
  STRESS = 'stress',
  OTHER = 'other'
}

export interface HealthPassDataToggles {
  // Required - cannot be turned off
  name: true;
  gender: true;
  dateOfBirth: true;

  // Optional - can be toggled
  medicalConditions: boolean;
  medications: boolean;
  allergies: boolean;
  lifestyleChoices: boolean;
  documents: boolean;

  // Specific items can be toggled individually
  specificConditions?: string[];
  specificMedications?: string[];
  specificAllergies?: string[];
  specificLifestyles?: string[];
  specificDocuments?: string[];
}

export interface AIProcessedDocument {
  suggestedName: string;
  suggestedDate: Date | null;
  suggestedNotes: string;
  documentType: DocumentType;
  extractedText: string;
  confidence: number;
  isHealthcareRelated: boolean;
  rejectionReason?: string;
}

export interface LebanesIdData {
  birth_place: string;
  dad_name: string;
  date_of_birth: string;
  first_name: string;
  government_id: string;
  last_name: string;
  mom_full_name: string;
}


// Constants

export const API_VERSION = 'v1';

export const HEALTH_PASS_EXPIRY_HOURS = 24;

export const MAX_FILE_SIZE_MB = 10;

export const SUPPORTED_DOCUMENT_FORMATS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const GOOGLE_DOCUMENT_AI = {
  PROJECT_ID: '312948262281',
  LOCATION: 'eu',
  PROCESSOR_ID: 'a269b61f40aebe5a',
  ENDPOINT: 'https://eu-documentai.googleapis.com/v1'
};

export const LEBANESE_ID_FIELDS = [
  'birth_place',
  'dad_name',
  'date_of_birth',
  'first_name',
  'government_id',
  'last_name',
  'mom_full_name'
] as const;


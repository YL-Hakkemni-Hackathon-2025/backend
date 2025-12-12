import { IsString, IsOptional, IsDate, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '@hakkemni/common';

// Request DTOs
export class UploadDocumentDto {
  @IsString()
  originalFileName!: string;

  @IsString()
  mimeType!: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

export class ConfirmDocumentDto {
  @IsString()
  documentName!: string;

  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  documentDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  documentName?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  documentDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Response DTOs
export class DocumentResponseDto {
  id!: string;
  userId!: string;
  originalFileName!: string;
  documentName!: string;
  documentType!: DocumentType;
  fileUrl!: string;
  mimeType!: string;
  fileSize?: number;
  documentDate?: Date;
  notes?: string;
  isAiProcessed!: boolean;
  isConfirmed!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class DocumentAiSuggestionDto {
  suggestedName!: string;
  suggestedDate?: Date;
  suggestedNotes!: string;
  suggestedType!: DocumentType;
  extractedText!: string;
  confidence!: number;
}

export class DocumentUploadResponseDto {
  id!: string;
  originalFileName!: string;
  fileUrl!: string;
  aiSuggestions!: DocumentAiSuggestionDto;
}

export class DocumentSummaryDto {
  id!: string;
  documentName!: string;
  documentType!: DocumentType;
  documentDate?: Date;
}


import { MedicalDocumentModel, MedicalDocument } from '@hakkemni/models';
import {
  UploadDocumentDto,
  ConfirmDocumentDto,
  UpdateDocumentDto,
  DocumentResponseDto,
  DocumentAiSuggestionDto,
  DocumentUploadResponseDto,
  DocumentSummaryDto
} from '@hakkemni/dto';
import { NotFoundError, DocumentType } from '@hakkemni/common';
import { aiService } from './ai.service';

export class DocumentService {
  /**
   * Upload and process a document with AI
   */
  async uploadAndProcess(
    userId: string,
    dto: UploadDocumentDto,
    fileUrl: string,
    fileContent: Buffer
  ): Promise<DocumentUploadResponseDto> {
    // Process document with AI to extract information
    console.log(userId);
    console.log(dto);
    console.log(fileUrl);
    console.log(fileContent);

    const aiSuggestions = await aiService.processDocument(fileContent, dto.mimeType);

    // Create document record with AI suggestions
    const document = await MedicalDocumentModel.create({
      userId,
      originalFileName: dto.originalFileName,
      documentName: aiSuggestions.suggestedName,
      documentType: aiSuggestions.documentType,
      fileUrl,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      documentDate: aiSuggestions.suggestedDate,
      aiSuggestedName: aiSuggestions.suggestedName,
      aiSuggestedDate: aiSuggestions.suggestedDate,
      aiGeneratedNotes: aiSuggestions.suggestedNotes,
      extractedText: aiSuggestions.extractedText,
      aiConfidence: aiSuggestions.confidence,
      isAiProcessed: true,
      isConfirmed: false
    });

    return {
      id: document._id.toString(),
      originalFileName: document.originalFileName,
      fileUrl: document.fileUrl,
      aiSuggestions: {
        suggestedName: aiSuggestions.suggestedName,
        suggestedDate: aiSuggestions.suggestedDate || undefined,
        suggestedNotes: aiSuggestions.suggestedNotes,
        suggestedType: aiSuggestions.documentType,
        extractedText: aiSuggestions.extractedText,
        confidence: aiSuggestions.confidence
      }
    };
  }

  /**
   * Confirm document with user edits
   */
  async confirmDocument(id: string, dto: ConfirmDocumentDto): Promise<DocumentResponseDto> {
    const document = await MedicalDocumentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          documentName: dto.documentName,
          documentType: dto.documentType,
          documentDate: dto.documentDate,
          notes: dto.notes,
          isConfirmed: true
        }
      },
      { new: true }
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    return this.toResponseDto(document);
  }

  /**
   * Find all documents for a user
   */
  async findByUserId(userId: string, confirmedOnly: boolean = true): Promise<DocumentResponseDto[]> {
    const query: any = { userId, isActive: true };
    if (confirmedOnly) {
      query.isConfirmed = true;
    }
    const documents = await MedicalDocumentModel.find(query).sort({ createdAt: -1 });
    return documents.map(d => this.toResponseDto(d));
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<DocumentResponseDto> {
    const document = await MedicalDocumentModel.findById(id);
    if (!document) {
      throw new NotFoundError('Document not found');
    }
    return this.toResponseDto(document);
  }

  /**
   * Update document
   */
  async update(id: string, dto: UpdateDocumentDto): Promise<DocumentResponseDto> {
    const document = await MedicalDocumentModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true }
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    return this.toResponseDto(document);
  }

  /**
   * Soft delete document
   */
  async delete(id: string): Promise<void> {
    const result = await MedicalDocumentModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } }
    );

    if (!result) {
      throw new NotFoundError('Document not found');
    }
  }

  /**
   * Get summaries for health pass
   */
  async getSummaries(userId: string, specificIds?: string[]): Promise<DocumentSummaryDto[]> {
    let query: any = { userId, isActive: true, isConfirmed: true };
    if (specificIds && specificIds.length > 0) {
      query._id = { $in: specificIds };
    }

    const documents = await MedicalDocumentModel.find(query);
    return documents.map(d => ({
      id: d._id.toString(),
      documentName: d.documentName,
      documentType: d.documentType as DocumentType,
      documentDate: d.documentDate
    }));
  }

  private toResponseDto(document: MedicalDocument): DocumentResponseDto {
    return {
      id: document._id.toString(),
      userId: document.userId.toString(),
      originalFileName: document.originalFileName,
      documentName: document.documentName,
      documentType: document.documentType as DocumentType,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      documentDate: document.documentDate,
      notes: document.notes,
      isAiProcessed: document.isAiProcessed,
      isConfirmed: document.isConfirmed,
      isActive: document.isActive,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }
}

export const documentService = new DocumentService();


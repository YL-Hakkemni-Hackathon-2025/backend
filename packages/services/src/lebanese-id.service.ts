import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import {
  LebanesIdData,
  GOOGLE_DOCUMENT_AI,
  DocumentProcessingError
} from '@hakkemni/common';
import { translationService } from './translation.service';

export class LebaneseIdService {
  private readonly client: DocumentProcessorServiceClient;
  private readonly projectId: string;
  private readonly location: string;
  private readonly processorId: string;

  constructor() {
    // Instantiate the Document AI client
    this.client = new DocumentProcessorServiceClient({ apiEndpoint: 'eu-documentai.googleapis.com' });
    this.projectId = GOOGLE_DOCUMENT_AI.PROJECT_ID;
    this.location = GOOGLE_DOCUMENT_AI.LOCATION;
    this.processorId = GOOGLE_DOCUMENT_AI.PROCESSOR_ID;
  }

  /**
   * Process Lebanese ID image using Google Document AI
   * @param imageBase64 - Base64 encoded image content
   * @param mimeType - MIME type of the image (default: image/jpeg)
   */
  async processLebanesId(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<LebanesIdData> {
    try {
      // The full resource name of the processor
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;

      // Debug logging
      console.log('🔍 Document AI Request Debug:');
      console.log('  - Processor name:', name);
      console.log('  - MimeType:', mimeType);
      console.log('  - Base64 length:', imageBase64.length);
      console.log('  - Base64 preview (first 100 chars):', imageBase64.substring(0, 100));
      console.log('  - Base64 preview (last 50 chars):', imageBase64.substring(imageBase64.length - 50));

      // Check if base64 has data URL prefix and remove it
      let cleanBase64 = imageBase64;
      if (imageBase64.includes(',')) {
        console.log('  - ⚠️ Found data URL prefix, stripping it...');
        cleanBase64 = imageBase64.split(',')[1];
      }

      // Remove any whitespace/newlines that might have been introduced
      cleanBase64 = cleanBase64.replace(/\s/g, '');

      // Validate base64
      const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64);
      console.log('  - Is valid base64:', isValidBase64);
      console.log('  - Clean base64 length:', cleanBase64.length);

      const request = {
        name,
        rawDocument: {
          content: cleanBase64,
          mimeType,
        },
      };

      // Process the document
      const [result] = await this.client.processDocument(request);
      const { document } = result;

      if (!document) {
        throw new DocumentProcessingError('No document returned from Document AI');
      }

      return await this.extractFieldsFromDocument(document);
    } catch (error: any) {
      // Log the full error details
      console.error('❌ Document AI Error:');
      console.error('  - Error message:', error.message);
      console.error('  - Error code:', error.code);
      console.error('  - Error details:', JSON.stringify(error.details, null, 2));

      if (error instanceof DocumentProcessingError) {
        throw error;
      }
      throw new DocumentProcessingError(`Failed to process Lebanese ID: ${error}`);
    }
  }

  /**
   * Process Lebanese ID from file buffer
   * @param fileBuffer - File buffer containing the image
   * @param mimeType - MIME type of the image
   */
  async processLebanesIdFromBuffer(fileBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<LebanesIdData> {
    const encodedImage = fileBuffer.toString('base64');
    return this.processLebanesId(encodedImage, mimeType);
  }

  /**
   * Extract Lebanese ID fields from Document AI response
   */
  private async extractFieldsFromDocument(document: any): Promise<LebanesIdData> {
    const { text, entities, pages } = document;

    // Log raw document text
    console.log('📄 Document AI Raw Text:');
    console.log(text);
    console.log('---');

    // Helper function to extract text from text anchor
    const getText = (textAnchor: any): string => {
      if (!textAnchor?.textSegments || textAnchor.textSegments.length === 0) {
        return '';
      }
      const startIndex = textAnchor.textSegments[0].startIndex || 0;
      const endIndex = textAnchor.textSegments[0].endIndex;
      return text.substring(startIndex, endIndex).trim();
    };

    const fieldMap: Record<string, string> = {};

    // Extract from entities (for entity extraction processors)
    if (entities && entities.length > 0) {
      console.log('🏷️ Entities found:', entities.length);
      for (const entity of entities) {
        const fieldName = entity.type?.toLowerCase().replace(/\s+/g, '_') || '';
        const fieldValue = entity.mentionText || getText(entity.textAnchor);
        console.log(`  - Entity: "${fieldName}" = "${fieldValue}"`);
        if (fieldName && fieldValue) {
          fieldMap[fieldName] = fieldValue;
        }
      }
    } else {
      console.log('🏷️ No entities found');
    }

    // Extract from form fields (for form parser processors)
    if (pages && pages.length > 0) {
      const page1 = pages[0];
      if (page1.formFields && page1.formFields.length > 0) {
        console.log('📝 Form fields found:', page1.formFields.length);
        for (const field of page1.formFields) {
          const fieldName = getText(field.fieldName?.textAnchor)
            .toLowerCase()
            .replace(/[:\s]+/g, '_')
            .replace(/_+$/, '');
          const fieldValue = getText(field.fieldValue?.textAnchor);
          console.log(`  - Field: "${fieldName}" = "${fieldValue}"`);
          if (fieldName && fieldValue) {
            fieldMap[fieldName] = fieldValue;
          }
        }
      } else {
        console.log('📝 No form fields found');
      }
    }

    console.log('🗺️ Final field map:', JSON.stringify(fieldMap, null, 2));

    // Map the extracted fields to our data structure
    const idDataArabic: LebanesIdData = {
      birth_place: this.findField(fieldMap, ['birth_place', 'place_of_birth', 'birthplace', 'lieu_de_naissance']),
      dad_name: this.findField(fieldMap, ['dad_name', 'father_name', 'father', 'pere', 'father\'s_name']),
      date_of_birth: this.findField(fieldMap, ['date_of_birth', 'dob', 'birth_date', 'birthdate', 'date_naissance']),
      first_name: this.findField(fieldMap, ['first_name', 'given_name', 'name', 'prenom', 'firstname']),
      government_id: this.findField(fieldMap, ['government_id', 'id_number', 'national_id', 'id', 'numero', 'record_number']),
      last_name: this.findField(fieldMap, ['last_name', 'family_name', 'surname', 'nom', 'lastname']),
      mom_full_name: this.findField(fieldMap, ['mom_full_name', 'mother_name', 'mother', 'mere', 'mother\'s_name'])
    };

    console.log('🎯 Mapped ID Data (Arabic):', JSON.stringify(idDataArabic, null, 2));

    // Validate required fields before translation
    if (!idDataArabic.government_id) {
      console.warn('⚠️ Could not find government_id in fieldMap keys:', Object.keys(fieldMap));
      throw new DocumentProcessingError('Could not extract government ID from the document');
    }

    if (!idDataArabic.first_name || !idDataArabic.last_name) {
      throw new DocumentProcessingError('Could not extract name from the document');
    }

    // Translate the data from Arabic to English
    const idData = await translationService.translateIdData(idDataArabic);

    return idData;
  }

  /**
   * Find a field value from multiple possible field names
   */
  private findField(fieldMap: Record<string, string>, possibleNames: string[]): string {
    for (const name of possibleNames) {
      if (fieldMap[name]) {
        return fieldMap[name];
      }
    }
    return '';
  }
}

export const lebaneseIdService = new LebaneseIdService();

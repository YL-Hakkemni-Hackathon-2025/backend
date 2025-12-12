import { GoogleGenAI } from '@google/genai';
import {
    DocumentType,
    AppointmentSpecialty,
    AIProcessedDocument,
    AIProcessingError
} from '@hakkemni/common';
import {
    MedicalConditionResponseDto,
    MedicationResponseDto,
    AllergyResponseDto,
    LifestyleResponseDto,
    DocumentResponseDto,
    AiHealthPassSuggestionsDto,
    AiItemRecommendationDto
} from '@hakkemni/dto';

// Initialize Gemini with new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Supported image MIME types for Gemini Vision
const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];

// Supported PDF MIME type
const PDF_MIME_TYPE = 'application/pdf';

// Default model
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

export class AiService {
    private modelName: string;

    constructor() {
        this.modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    }

    /**
     * Process a medical document and extract information using AI
     * Uses Gemini Flash 2.5 for document OCR and analysis
     */
    async processDocument(fileContent: Buffer, mimeType: string): Promise<AIProcessedDocument> {
        try {
            const systemPrompt = `You are a medical document analyzer and clinical assistant. Analyze the provided medical document and extract information.

Your task:
1. Identify a suitable document name (e.g., "Blood Test Results - Complete Blood Count", "MRI Brain Scan", etc.)
2. Find the date of the document if visible
3. **IMPORTANT - Generate intelligent clinical notes**: 
   - Do NOT just copy/paste all the values
   - Identify and highlight ONLY abnormal values, concerning findings, or clinically significant results
   - Compare values against normal reference ranges
   - Flag values that are high, low, or borderline
   - Summarize what these findings might indicate
   - If all values are normal, state "All values within normal limits"
   - Use clear, concise medical language
4. Determine the document type
5. Extract all visible text (for searchability)

Example of GOOD notes for a blood test:
"Key findings: Elevated glucose (126 mg/dL - prediabetic range), Low hemoglobin (10.2 g/dL - mild anemia), Elevated CRP (15 mg/L - indicates inflammation). All other CBC and coagulation values within normal limits."

Example of BAD notes (don't do this):
"Hemoglobin: 15.8 g/dL, Hematocrit: 47.4%, WBC: 7.51..."

Respond in JSON format:
{
  "suggestedName": "string - descriptive name for the document",
  "documentDate": "YYYY-MM-DD or null if not visible",
  "notes": "string - CLINICAL SUMMARY highlighting only abnormal/significant findings, not raw data dump",
  "documentType": "lab_report | mri_scan | ct_scan | x_ray | prescription | medical_report | vaccination_record | other",
  "extractedText": "string - all visible text from document for search purposes",
  "confidence": "number between 0 and 1"
}`;

            let contentString: string;

            // Check if the file is a PDF or image
            if (mimeType === PDF_MIME_TYPE || SUPPORTED_IMAGE_TYPES.includes(mimeType.toLowerCase())) {
                contentString = await this.processDocumentWithGemini(fileContent, mimeType, systemPrompt);
            } else {
                throw new AIProcessingError(`Unsupported file type: ${mimeType}. Supported types: PDF, JPEG, PNG, GIF, WEBP`);
            }

            if (!contentString) {
                throw new AIProcessingError('No response from AI');
            }

            const parsed = JSON.parse(contentString);

            return {
                suggestedName: parsed.suggestedName || 'Medical Document',
                suggestedDate: parsed.documentDate ? new Date(parsed.documentDate) : null,
                suggestedNotes: parsed.notes || '',
                documentType: this.mapDocumentType(parsed.documentType),
                extractedText: parsed.extractedText || '',
                confidence: parsed.confidence || 0.5
            };
        } catch (error) {
            console.error('AI document processing error:', error);
            // Return default values if AI processing fails
            return {
                suggestedName: 'Medical Document',
                suggestedDate: null,
                suggestedNotes: 'Unable to automatically process document. Please review manually.',
                documentType: DocumentType.OTHER,
                extractedText: '',
                confidence: 0
            };
        }
    }

    /**
     * Generate AI recommendations for health pass data sharing
     * based on the appointment specialty
     */
    async generateHealthPassRecommendations(
        appointmentSpecialty: AppointmentSpecialty,
        userData: {
            conditions: MedicalConditionResponseDto[];
            medications: MedicationResponseDto[];
            allergies: AllergyResponseDto[];
            lifestyles: LifestyleResponseDto[];
            documents: DocumentResponseDto[];
        }
    ): Promise<AiHealthPassSuggestionsDto> {
        try {
            const prompt = `You are a medical AI assistant helping a patient prepare for a ${appointmentSpecialty} appointment.

The patient has the following medical information. For EACH item, you must determine if it's relevant to share for this specific appointment type and provide a brief recommendation explaining why or why not.

Medical Conditions:
${userData.conditions.map(c => `- ID: "${c.id}" | Name: ${c.name} | Diagnosed: ${c.diagnosedDate || 'unknown'} | Notes: ${c.notes || 'none'}`).join('\n') || 'None'}

Medications:
${userData.medications.map(m => `- ID: "${m.id}" | Name: ${m.medicationName} | Dosage: ${m.dosageAmount} | Frequency: ${m.frequency} | Notes: ${m.notes || 'none'}`).join('\n') || 'None'}

Allergies:
${userData.allergies.map(a => `- ID: "${a.id}" | Allergen: ${a.allergen} | Type: ${a.type} | Severity: ${a.severity || 'unknown'} | Reaction: ${a.reaction || 'unknown'}`).join('\n') || 'None'}

Lifestyle:
${userData.lifestyles.map(l => `- ID: "${l.id}" | Category: ${l.category} | Description: ${l.description} | Frequency: ${l.frequency || 'unknown'}`).join('\n') || 'None'}

Documents:
${userData.documents.map(d => `- ID: "${d.id}" | Name: ${d.documentName} | Type: ${d.documentType} | Date: ${d.documentDate || 'unknown'} | Notes: ${d.notes || 'none'}`).join('\n') || 'None'}

For this ${appointmentSpecialty} appointment, analyze EACH item and provide:
1. Whether it's relevant (true/false)
2. A brief recommendation explaining why this item should or should not be shared

Respond in JSON format exactly like this:
{
  "conditionRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Brief explanation why this condition is/isn't relevant" }
  ],
  "medicationRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Brief explanation why this medication is/isn't relevant" }
  ],
  "allergyRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Brief explanation why this allergy is/isn't relevant" }
  ],
  "lifestyleRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Brief explanation why this lifestyle choice is/isn't relevant" }
  ],
  "documentRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Brief explanation why this document is/isn't relevant" }
  ],
  "overallRecommendation": "A brief overall summary of what to share and why for this appointment"
}

IMPORTANT:
- You MUST include ALL items from each category in your response, even if not relevant
- Use the EXACT IDs provided above
- Keep recommendations concise (1-2 sentences)`;

            const response = await ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json'
                }
            });

            const rawContent = response.text;

            if (!rawContent) {
                throw new AIProcessingError('No response from AI');
            }

            console.log(rawContent);

            const parsed = JSON.parse(rawContent);

            // Helper to create default recommendation for missing items
            const createDefaultRecommendation = (id: string): AiItemRecommendationDto => ({
                id,
                isRelevant: true,
                recommendation: 'Recommended to share with your doctor.'
            });

            // Map and validate condition recommendations
            const conditionRecommendations: AiItemRecommendationDto[] = userData.conditions.map(c => {
                const found = parsed.conditionRecommendations?.find((r: any) => r.id === c.id);
                return found ? { id: c.id, isRelevant: !!found.isRelevant, recommendation: found.recommendation || '' } : createDefaultRecommendation(c.id);
            });

            // Map and validate medication recommendations
            const medicationRecommendations: AiItemRecommendationDto[] = userData.medications.map(m => {
                const found = parsed.medicationRecommendations?.find((r: any) => r.id === m.id);
                return found ? { id: m.id, isRelevant: !!found.isRelevant, recommendation: found.recommendation || '' } : createDefaultRecommendation(m.id);
            });

            // Map and validate allergy recommendations
            const allergyRecommendations: AiItemRecommendationDto[] = userData.allergies.map(a => {
                const found = parsed.allergyRecommendations?.find((r: any) => r.id === a.id);
                return found ? { id: a.id, isRelevant: !!found.isRelevant, recommendation: found.recommendation || '' } : createDefaultRecommendation(a.id);
            });

            // Map and validate lifestyle recommendations
            const lifestyleRecommendations: AiItemRecommendationDto[] = userData.lifestyles.map(l => {
                const found = parsed.lifestyleRecommendations?.find((r: any) => r.id === l.id);
                return found ? { id: l.id, isRelevant: !!found.isRelevant, recommendation: found.recommendation || '' } : createDefaultRecommendation(l.id);
            });

            // Map and validate document recommendations
            const documentRecommendations: AiItemRecommendationDto[] = userData.documents.map(d => {
                const found = parsed.documentRecommendations?.find((r: any) => r.id === d.id);
                return found ? { id: d.id, isRelevant: !!found.isRelevant, recommendation: found.recommendation || '' } : createDefaultRecommendation(d.id);
            });

            return {
                conditionRecommendations,
                medicationRecommendations,
                allergyRecommendations,
                lifestyleRecommendations,
                documentRecommendations,
                overallRecommendation: parsed.overallRecommendation || 'Share relevant medical information with your doctor.'
            };
        } catch (error) {
            console.error('AI health pass recommendations error:', error);
            // Return default recommendations if AI fails
            return {
                conditionRecommendations: userData.conditions.map(c => ({
                    id: c.id,
                    isRelevant: true,
                    recommendation: 'Recommended to share with your doctor.'
                })),
                medicationRecommendations: userData.medications.map(m => ({
                    id: m.id,
                    isRelevant: true,
                    recommendation: 'Recommended to share with your doctor.'
                })),
                allergyRecommendations: userData.allergies.map(a => ({
                    id: a.id,
                    isRelevant: true,
                    recommendation: 'Important for medication safety.'
                })),
                lifestyleRecommendations: userData.lifestyles.map(l => ({
                    id: l.id,
                    isRelevant: false,
                    recommendation: 'Share if relevant to your appointment.'
                })),
                documentRecommendations: userData.documents.map(d => ({
                    id: d.id,
                    isRelevant: false,
                    recommendation: 'Share if relevant to your appointment.'
                })),
                overallRecommendation: 'We recommend sharing your medical conditions, medications, and allergies with your doctor for a comprehensive consultation.'
            };
        }
    }

    /**
     * Process a document (PDF or image) using Gemini Vision
     */
    private async processDocumentWithGemini(
        fileContent: Buffer,
        mimeType: string,
        systemPrompt: string
    ): Promise<string> {
        // Convert buffer to base64
        const base64Data = fileContent.toString('base64');

        // Create the inline data part for Gemini
        const filePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        const response = await ai.models.generateContent({
            model: this.modelName,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: systemPrompt + '\n\nPlease analyze this medical document and extract the relevant information. Respond ONLY with the requested JSON.' },
                        filePart
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json'
            }
        });

        return response.text || '';
    }

    /**
     * Map string to DocumentType enum
     */
    private mapDocumentType(type: string): DocumentType {
        const typeMap: Record<string, DocumentType> = {
            'lab_report': DocumentType.LAB_REPORT,
            'mri_scan': DocumentType.MRI_SCAN,
            'ct_scan': DocumentType.CT_SCAN,
            'x_ray': DocumentType.X_RAY,
            'prescription': DocumentType.PRESCRIPTION,
            'medical_report': DocumentType.MEDICAL_REPORT,
            'vaccination_record': DocumentType.VACCINATION_RECORD
        };

        return typeMap[type?.toLowerCase()] || DocumentType.OTHER;
    }
}

export const aiService = new AiService();

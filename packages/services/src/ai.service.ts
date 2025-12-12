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
    AiHealthPassSuggestionsDto
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

The patient has the following medical information (each item includes its ID which you MUST use in your response):

Medical Conditions:
${userData.conditions.map(c => `- [ID: ${c.id}] ${c.name} (diagnosed: ${c.diagnosedDate || 'unknown'})`).join('\n') || 'None'}

Medications:
${userData.medications.map(m => `- [ID: ${m.id}] ${m.medicationName} ${m.dosageAmount} (${m.frequency})`).join('\n') || 'None'}

Allergies:
${userData.allergies.map(a => `- [ID: ${a.id}] ${a.allergen} (${a.type}, severity: ${a.severity || 'unknown'})`).join('\n') || 'None'}

Lifestyle:
${userData.lifestyles.map(l => `- [ID: ${l.id}] ${l.category}: ${l.description}`).join('\n') || 'None'}

Documents:
${userData.documents.map(d => `- [ID: ${d.id}] ${d.documentName} (${d.documentType})${d.notes ? ` - Notes: ${d.notes}` : ''}`).join('\n') || 'None'}

Based on this ${appointmentSpecialty} appointment, determine:
1. Which SPECIFIC items should be shared — return the EXACT IDs from the lists above (e.g., ["6789abc...", "1234def..."]) in the corresponding arrays below.
2. A brief recommendation message for the patient
3. A short reasoning field explaining the choice

Important output rules (PLEASE FOLLOW EXACTLY):
- The response MUST be valid JSON and NOTHING else.
- You MUST use the exact IDs provided in brackets [ID: ...] above. Do NOT invent IDs or use item names as IDs.
- Do NOT set all category booleans to true. Only set a category boolean to true if you also provide one or more specific IDs for that category.
- The JSON MUST have the structure below. If a category has no suggested specific IDs, set its specific array to [] and the category boolean to false.

Respond in JSON format exactly like this:
{
  "suggestedToggles": {
    "medicalConditions": boolean,
    "medications": boolean,
    "allergies": boolean,
    "lifestyleChoices": boolean,
    "documents": boolean,
    "specificConditions": ["exact-id-from-above"],
    "specificMedications": ["exact-id-from-above"],
    "specificAllergies": ["exact-id-from-above"],
    "specificDocuments": ["exact-id-from-above"]
  },
  "recommendations": "Brief message about what to share and why",
  "reasoning": "Detailed explanation of why these items are relevant"
}`;

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

            // Normalize and prefer specific IDs as the source of truth for toggles
            const parsedToggles = parsed.suggestedToggles || {};
            const parsedSpecificConditions: string[] = Array.isArray(parsedToggles.specificConditions) ? parsedToggles.specificConditions : [];
            const parsedSpecificMedications: string[] = Array.isArray(parsedToggles.specificMedications) ? parsedToggles.specificMedications : [];
            const parsedSpecificAllergies: string[] = Array.isArray(parsedToggles.specificAllergies) ? parsedToggles.specificAllergies : [];
            const parsedSpecificDocuments: string[] = Array.isArray(parsedToggles.specificDocuments) ? parsedToggles.specificDocuments : [];

            // Booleans: derive from specifics
            const medicalConditionsToggle = parsedSpecificConditions.length > 0;
            const medicationsToggle = parsedSpecificMedications.length > 0;
            const allergiesToggle = parsedSpecificAllergies.length > 0;
            const documentsToggle = parsedSpecificDocuments.length > 0;
            const lifestyleChoicesToggle = !!parsedToggles.lifestyleChoices;

            // Filter specific IDs to only include valid ones
            const validConditionIds = userData.conditions.map(c => c.id);
            const validMedicationIds = userData.medications.map(m => m.id);
            const validAllergyIds = userData.allergies.map(a => a.id);
            const validDocumentIds = userData.documents.map(d => d.id);

            return {
                suggestedToggles: {
                    medicalConditions: medicalConditionsToggle,
                    medications: medicationsToggle,
                    allergies: allergiesToggle,
                    lifestyleChoices: lifestyleChoicesToggle,
                    documents: documentsToggle,
                    specificConditions: parsedSpecificConditions.filter((id: string) => validConditionIds.includes(id)),
                    specificMedications: parsedSpecificMedications.filter((id: string) => validMedicationIds.includes(id)),
                    specificAllergies: parsedSpecificAllergies.filter((id: string) => validAllergyIds.includes(id)),
                    specificDocuments: parsedSpecificDocuments.filter((id: string) => validDocumentIds.includes(id))
                },
                recommendations: parsed.recommendations || 'Share relevant medical information with your doctor.',
                reasoning: parsed.reasoning || ''
            };
        } catch (error) {
            console.error('AI health pass recommendations error:', error);
            // Return default recommendations if AI fails
            return {
                suggestedToggles: {
                    medicalConditions: true,
                    medications: true,
                    allergies: true,
                    lifestyleChoices: false,
                    documents: false,
                    specificConditions: [],
                    specificMedications: [],
                    specificAllergies: [],
                    specificDocuments: []
                },
                recommendations: 'We recommend sharing your medical conditions, medications, and allergies with your doctor for a comprehensive consultation.',
                reasoning: 'Default recommendation - AI processing unavailable'
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

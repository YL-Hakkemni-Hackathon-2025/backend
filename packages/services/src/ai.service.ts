import { GoogleGenAI } from '@google/genai';
import {
    DocumentType,
    AppointmentSpecialty,
    AIProcessedDocument,
    AIProcessingError,
    NonHealthcareDocumentError
} from '@hakkemni/common';
import {
    MedicalConditionResponseDto,
    MedicationResponseDto,
    AllergyResponseDto,
    HabitResponseDto,
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
            const systemPrompt = `You are a medical document analyzer and clinical assistant. Analyze the provided document and determine if it is healthcare-related.

**FIRST - Determine if this is a healthcare document:**
- Healthcare documents include: lab reports, medical records, prescriptions, imaging scans (MRI, CT, X-ray), vaccination records, medical reports, discharge summaries, clinical notes, diagnostic reports, etc.
- NON-healthcare documents include: invoices, receipts, legal documents, personal photos, random images, business documents, ID cards (unless medical ID), resumes, etc.
- If the document is NOT healthcare-related, set isHealthcareRelated to false and provide a rejectionReason.

**If healthcare-related, extract:**
1. Identify a suitable document name (e.g., "Blood Test Results - Complete Blood Count", "MRI Brain Scan", etc.)
2. Find the date of the document if visible
3. **IMPORTANT - Generate intelligent clinical notes**: 
   - For MEDICAL REPORTS: Focus on the CONCLUSION, DIAGNOSIS, or IMPRESSION section. This is the most important part.
   - For LAB REPORTS: Identify and highlight ONLY abnormal values, concerning findings, or clinically significant results. Compare values against normal reference ranges.
   - For IMAGING (MRI, CT, X-ray): Focus on the radiologist's findings and conclusion.
   - Do NOT just copy/paste all the values - summarize key clinical findings
   - If all values are normal, state "All values within normal limits"
   - Use clear, concise medical language
4. Determine the document type
5. Extract all visible text (for searchability)

Example of GOOD notes for a medical report:
"Diagnosis: Type 2 Diabetes Mellitus with mild nephropathy. Recommended follow-up in 3 months."

Example of GOOD notes for a lab test:
"Key findings: Elevated glucose (126 mg/dL - prediabetic range), Low hemoglobin (10.2 g/dL - mild anemia). All other values within normal limits."

Example of GOOD notes for imaging:
"Impression: No acute intracranial abnormality. Small benign cyst noted in left frontal lobe, stable."

Respond in JSON format:
{
  "isHealthcareRelated": true/false,
  "rejectionReason": "string - only if isHealthcareRelated is false, explain why this is not a medical document",
  "suggestedName": "string - descriptive name for the document (only if healthcare-related)",
  "documentDate": "YYYY-MM-DD or null if not visible",
  "notes": "string - CLINICAL SUMMARY focusing on diagnosis/conclusion for medical reports, or key abnormal findings for lab reports",
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

            // Check if document is healthcare-related
            if (parsed.isHealthcareRelated === false) {
                throw new NonHealthcareDocumentError(
                    parsed.rejectionReason || 'This document does not appear to be healthcare-related. Please upload a medical document such as lab reports, prescriptions, imaging scans, or medical records.'
                );
            }

            return {
                suggestedName: parsed.suggestedName || 'Medical Document',
                suggestedDate: parsed.documentDate ? new Date(parsed.documentDate) : null,
                suggestedNotes: parsed.notes || '',
                documentType: this.mapDocumentType(parsed.documentType),
                extractedText: parsed.extractedText || '',
                confidence: parsed.confidence || 0.5,
                isHealthcareRelated: true
            };
        } catch (error) {
            console.error('AI document processing error:', error);

            // Re-throw NonHealthcareDocumentError so it propagates properly
            if (error instanceof NonHealthcareDocumentError) {
                throw error;
            }

            // Re-throw AIProcessingError for unsupported file types
            if (error instanceof AIProcessingError) {
                throw error;
            }

            // Return default values if AI processing fails for other reasons
            return {
                suggestedName: 'Medical Document',
                suggestedDate: null,
                suggestedNotes: 'Unable to automatically process document. Please review manually.',
                documentType: DocumentType.OTHER,
                extractedText: '',
                confidence: 0,
                isHealthcareRelated: true
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
            habits: HabitResponseDto[];
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
${userData.allergies.map(a => `- ID: "${a.id}" | Allergen: ${a.allergen} | Severity: ${a.severity || 'unknown'} | Notes: ${a.notes || 'none'}`).join('\n') || 'None'}

Lifestyle Habits:
${userData.habits.map(h => `- ID: "${h.category}" | Category: ${h.category} | Frequency: ${h.frequency} | Notes: ${h.notes || 'none'}`).join('\n') || 'None'}

Documents:
${userData.documents.map(d => `- ID: "${d.id}" | Name: ${d.documentName} | Type: ${d.documentType} | Date: ${d.documentDate || 'unknown'} | Notes: ${d.notes || 'none'}`).join('\n') || 'None'}

For this ${appointmentSpecialty} appointment, analyze EACH item and provide:
1. Whether it's relevant (true/false)
2. A single-line recommendation (max 10-15 words) explaining why

Respond in JSON format exactly like this:
{
  "conditionRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Single line reason" }
  ],
  "medicationRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Single line reason" }
  ],
  "allergyRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Single line reason" }
  ],
  "habitRecommendations": [
    { "id": "category-from-above", "isRelevant": true/false, "recommendation": "Single line reason" }
  ],
  "documentRecommendations": [
    { "id": "exact-id-from-above", "isRelevant": true/false, "recommendation": "Single line reason" }
  ],
  "overallRecommendation": "A brief overall summary of what to share and why for this appointment"
}

IMPORTANT:
- You MUST include ALL items from each category in your response, even if not relevant
- Use the EXACT IDs provided above (for habits, use the category as the ID)
- Keep recommendations to ONE LINE only (max 10-15 words)`;

            const response = await ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
                config: {
                    temperature: 0, // Deterministic output for consistent results
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

            // Map and validate habit recommendations (use category as ID)
            const habitRecommendations: AiItemRecommendationDto[] = userData.habits.map(h => {
                const found = parsed.habitRecommendations?.find((r: any) => r.id === h.category);
                return found ? { id: h.category, isRelevant: !!found.isRelevant, recommendation: found.recommendation || '' } : createDefaultRecommendation(h.category);
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
                habitRecommendations,
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
                habitRecommendations: userData.habits.map(h => ({
                    id: h.category,
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
     * Generate an AI profile summary for the health pass
     * Takes into account toggled items, patient demographics, and appointment type
     */
    async generateProfileSummary(
        appointmentSpecialty: AppointmentSpecialty,
        patientInfo: {
            fullName: string;
            dateOfBirth: Date;
            gender?: string;
        },
        toggledData: {
            conditions: MedicalConditionResponseDto[];
            medications: MedicationResponseDto[];
            allergies: AllergyResponseDto[];
            habits: HabitResponseDto[];
            documents: DocumentResponseDto[];
        },
        totalCounts?: {
            conditions: number;
            medications: number;
            allergies: number;
            habits: number;
            documents: number;
        }
    ): Promise<string> {
        try {
            // Calculate age
            const today = new Date();
            const birthDate = new Date(patientInfo.dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Helper to format category status
            const formatCategoryStatus = (
                sharedItems: any[],
                totalCount: number | undefined,
                formatItem: (item: any) => string,
                categoryName: string
            ): string => {
                if (sharedItems.length > 0) {
                    return sharedItems.map(formatItem).join('\n');
                }
                if (totalCount !== undefined && totalCount > 0) {
                    return `None shared for this ${appointmentSpecialty} appointment (${totalCount} on file, not relevant to this specialty)`;
                }
                return 'None on file';
            };

            const prompt = `You are a medical AI assistant. Generate a brief, professional patient profile summary for a ${appointmentSpecialty} appointment.

Patient Information:
- Name: ${patientInfo.fullName}
- Age: ${age} years old
- Gender: ${patientInfo.gender || 'Not specified'}
- Date of Birth: ${patientInfo.dateOfBirth.toISOString().split('T')[0]}

Medical Information Shared for This Appointment:

Medical Conditions:
${formatCategoryStatus(
    toggledData.conditions,
    totalCounts?.conditions,
    (c) => `- ${c.name}${c.notes ? ` (${c.notes})` : ''}`,
    'conditions'
)}

Current Medications:
${formatCategoryStatus(
    toggledData.medications,
    totalCounts?.medications,
    (m) => `- ${m.medicationName} ${m.dosageAmount} ${m.frequency}`,
    'medications'
)}

Known Allergies:
${formatCategoryStatus(
    toggledData.allergies,
    totalCounts?.allergies,
    (a) => `- ${a.allergen} (${a.severity || 'severity unknown'})${a.notes ? `: ${a.notes}` : ''}`,
    'allergies'
)}

Lifestyle Habits:
${formatCategoryStatus(
    toggledData.habits,
    totalCounts?.habits,
    (h) => `- ${h.category}: ${h.frequency}${h.notes ? ` (${h.notes})` : ''}`,
    'habits'
)}

Medical Documents:
${formatCategoryStatus(
    toggledData.documents,
    totalCounts?.documents,
    (d) => `- ${d.documentName} (${d.documentType})${d.notes ? `: ${d.notes}` : ''}`,
    'documents'
)}

Generate a concise 2-3 sentence professional summary that a doctor can quickly read to understand the patient's health profile before the appointment. Focus on clinically relevant information for the ${appointmentSpecialty} specialty.

IMPORTANT RULES:
- If a category says "None on file", the patient has no records in that category.
- If a category says "None shared... (X on file, not relevant)", the patient HAS records but they were deemed not relevant to this specialty. DO NOT say the patient has "no allergies" or "no conditions" - instead mention they exist but weren't shared for this visit.
- Be factual and do not make assumptions beyond the provided data.

Respond with ONLY the summary text, no JSON, no formatting, no quotes.`;

            const response = await ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
                config: {
                    temperature: 0 // Deterministic output for consistent results
                }
            });

            const summary = response.text?.trim();

            if (!summary) {
                return this.generateDefaultProfileSummary(age, patientInfo.gender, toggledData);
            }

            return summary;
        } catch (error) {
            console.error('AI profile summary generation error:', error);
            // Return a basic default summary
            const today = new Date();
            const birthDate = new Date(patientInfo.dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return this.generateDefaultProfileSummary(age, patientInfo.gender, toggledData);
        }
    }

    /**
     * Generate a default profile summary when AI is unavailable
     */
    private generateDefaultProfileSummary(
        age: number,
        gender: string | undefined,
        toggledData: {
            conditions: MedicalConditionResponseDto[];
            medications: MedicationResponseDto[];
            allergies: AllergyResponseDto[];
            habits: HabitResponseDto[];
            documents: DocumentResponseDto[];
        }
    ): string {
        const parts: string[] = [];

        parts.push(`${age}-year-old ${gender || 'patient'}`);

        if (toggledData.conditions.length > 0) {
            parts.push(`with ${toggledData.conditions.map(c => c.name).join(', ')}`);
        }

        if (toggledData.medications.length > 0) {
            parts.push(`currently taking ${toggledData.medications.length} medication(s)`);
        }

        if (toggledData.allergies.length > 0) {
            parts.push(`with known allergies to ${toggledData.allergies.map(a => a.allergen).join(', ')}`);
        }

        return parts.join(' ') + '.';
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
                temperature: 0, // Deterministic output for consistent results
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

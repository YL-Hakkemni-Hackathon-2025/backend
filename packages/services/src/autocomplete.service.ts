import { GoogleGenAI } from '@google/genai';
import { AIProcessingError } from '@hakkemni/common';
import {
  MedicalConditionSuggestionDto,
  MedicationSuggestionDto,
  AllergySuggestionDto,
  MedicalConditionAutocompleteResponseDto,
  MedicationAutocompleteResponseDto,
  AllergyAutocompleteResponseDto
} from '@hakkemni/dto';

// Initialize Gemini with new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Fast model for autocomplete
const AUTOCOMPLETE_MODEL = 'gemini-2.5-flash-lite';

export class AutocompleteService {
  private modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_AUTOCOMPLETE_MODEL || AUTOCOMPLETE_MODEL;
  }

  /**
   * Get medical condition suggestions based on user input
   */
  async getMedicalConditionSuggestions(
    query: string,
    limit: number = 10,
    context?: string
  ): Promise<MedicalConditionAutocompleteResponseDto> {
    try {
      if (!query || query.trim().length < 2) {
        return { suggestions: [], query, hasMore: false };
      }

      const prompt = `You are a medical knowledge assistant. The user is typing a medical condition name and needs autocomplete suggestions.

User input: "${query}"
${context ? `Additional context: ${context}` : ''}

Provide up to ${limit} relevant medical condition suggestions that match or start with the user's input.
Include common conditions, diseases, syndromes, and disorders.
Prioritize more common conditions first.

Respond in JSON format:
{
  "suggestions": [
    {
      "name": "Full condition name",
      "description": "Brief 1-sentence description of the condition",
      "category": "Category (e.g., Cardiovascular, Respiratory, Neurological, Endocrine, etc.)",
      "icdCode": "ICD-10 code if applicable (e.g., E11 for Type 2 Diabetes)",
      "synonyms": ["Alternative names", "Common abbreviations"]
    }
  ],
  "hasMore": true/false
}

Guidelines:
- Match conditions that START with or CONTAIN the query
- Include both the medical term and common name when applicable
- Sort by relevance and commonality
- Include ICD-10 codes when available
- Be accurate with medical terminology`;

      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawContent = response.text;
      if (!rawContent) {
        return { suggestions: [], query, hasMore: false };
      }

      const parsed = JSON.parse(rawContent);

      const suggestions: MedicalConditionSuggestionDto[] = (parsed.suggestions || []).map((s: any) => ({
        name: s.name || '',
        description: s.description || undefined,
        category: s.category || undefined,
        icdCode: s.icdCode || undefined,
        synonyms: s.synonyms || undefined
      }));

      return {
        suggestions: suggestions.slice(0, limit),
        query,
        hasMore: parsed.hasMore || suggestions.length >= limit
      };
    } catch (error) {
      console.error('Medical condition autocomplete error:', error);
      // Return empty result on error instead of throwing
      return { suggestions: [], query, hasMore: false };
    }
  }

  /**
   * Get medication suggestions based on user input
   */
  async getMedicationSuggestions(
    query: string,
    limit: number = 10,
    context?: string
  ): Promise<MedicationAutocompleteResponseDto> {
    try {
      if (!query || query.trim().length < 2) {
        return { suggestions: [], query, hasMore: false };
      }

      const prompt = `You are a pharmaceutical knowledge assistant. The user is typing a medication name and needs autocomplete suggestions.

User input: "${query}"
${context ? `Additional context: ${context}` : ''}

Provide up to ${limit} relevant medication suggestions that match the user's input.
Include both brand names and generic names.
Prioritize commonly prescribed medications first.

Respond in JSON format:
{
  "suggestions": [
    {
      "name": "Primary medication name (generic preferred)",
      "genericName": "Generic/INN name",
      "brandNames": ["Common brand names"],
      "drugClass": "Pharmacological class (e.g., ACE Inhibitor, Beta Blocker, SSRI)",
      "commonDosages": ["Common dosage strengths (e.g., 10mg, 25mg, 50mg)"],
      "forms": ["Available forms (e.g., tablet, capsule, injection, syrup)"]
    }
  ],
  "hasMore": true/false
}

Guidelines:
- Match medications that START with or CONTAIN the query
- Search both generic names and brand names
- Include the most common dosages
- Sort by relevance and prescribing frequency
- Be accurate with drug names and classifications`;

      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawContent = response.text;
      if (!rawContent) {
        return { suggestions: [], query, hasMore: false };
      }

      const parsed = JSON.parse(rawContent);

      const suggestions: MedicationSuggestionDto[] = (parsed.suggestions || []).map((s: any) => ({
        name: s.name || '',
        genericName: s.genericName || undefined,
        brandNames: s.brandNames || undefined,
        drugClass: s.drugClass || undefined,
        commonDosages: s.commonDosages || undefined,
        forms: s.forms || undefined
      }));

      return {
        suggestions: suggestions.slice(0, limit),
        query,
        hasMore: parsed.hasMore || suggestions.length >= limit
      };
    } catch (error) {
      console.error('Medication autocomplete error:', error);
      return { suggestions: [], query, hasMore: false };
    }
  }

  /**
   * Get allergy suggestions based on user input
   */
  async getAllergySuggestions(
    query: string,
    limit: number = 10,
    context?: string
  ): Promise<AllergyAutocompleteResponseDto> {
    try {
      if (!query || query.trim().length < 2) {
        return { suggestions: [], query, hasMore: false };
      }

      const prompt = `You are a medical allergy knowledge assistant. The user is typing an allergen name and needs autocomplete suggestions.

User input: "${query}"
${context ? `Additional context: ${context}` : ''}

Provide up to ${limit} relevant allergy/allergen suggestions that match the user's input.
Include drug allergies, food allergies, and environmental allergies.
Prioritize common allergens first.

Respond in JSON format:
{
  "suggestions": [
    {
      "name": "Allergen name",
      "type": "Type of allergy (drug, food, environmental, insect, latex, other)",
      "commonReactions": ["Common reactions (e.g., hives, anaphylaxis, rash, swelling)"],
      "crossReactivities": ["Related allergens that may cause cross-reactions"]
    }
  ],
  "hasMore": true/false
}

Guidelines:
- Match allergens that START with or CONTAIN the query
- Include common drug allergies (Penicillin, Sulfa, NSAIDs, etc.)
- Include common food allergies (Peanut, Shellfish, Milk, etc.)
- Include environmental allergies (Pollen, Dust mites, Pet dander, etc.)
- Note important cross-reactivities (e.g., Penicillin-Cephalosporin)
- Sort by relevance and commonality
- Be medically accurate`;

      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawContent = response.text;
      if (!rawContent) {
        return { suggestions: [], query, hasMore: false };
      }

      const parsed = JSON.parse(rawContent);

      const suggestions: AllergySuggestionDto[] = (parsed.suggestions || []).map((s: any) => ({
        name: s.name || '',
        type: s.type || 'other',
        commonReactions: s.commonReactions || undefined,
        crossReactivities: s.crossReactivities || undefined
      }));

      return {
        suggestions: suggestions.slice(0, limit),
        query,
        hasMore: parsed.hasMore || suggestions.length >= limit
      };
    } catch (error) {
      console.error('Allergy autocomplete error:', error);
      return { suggestions: [], query, hasMore: false };
    }
  }
}

export const autocompleteService = new AutocompleteService();


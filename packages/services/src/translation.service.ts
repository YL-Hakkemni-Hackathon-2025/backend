import { GoogleGenAI } from '@google/genai';

// Initialize Gemini with new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Default model for translation (fast and efficient)
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

export class TranslationService {
  private modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  }

  /**
   * Use AI to transliterate Arabic names to English phonetically
   * AI understands context - "ربيع" as a name becomes "Rabih", not "Spring"
   */
  async transliterateWithAI(arabicText: string, context: 'name' | 'place'): Promise<string> {
    if (!arabicText || arabicText.trim() === '') {
      return '';
    }

    try {
      const prompt = context === 'name'
        ? `Transliterate this Arabic personal name to English using the most common Lebanese/Arabic romanization. 
           Do NOT translate the meaning - convert the SOUND phonetically.
           For example: "ربيع" should be "Rabih" (not "Spring"), "جوزف" should be "Joseph", "بوليت" should be "Paulette".
           Only respond with the transliterated name, nothing else.
           
           Arabic name: ${arabicText}`
        : `Translate or transliterate this Arabic place name to its common English name.
           For example: "زحلة" should be "Zahle", "بيروت" should be "Beirut".
           Only respond with the English place name, nothing else.
           
           Arabic place: ${arabicText}`;

      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: 0, // Deterministic output for consistent transliteration
          systemInstruction: 'You are an expert in Arabic to English transliteration, specializing in Lebanese names and places. You provide accurate phonetic conversions. Only respond with the transliterated text, nothing else.'
        }
      });

      const result = response.text?.trim() || arabicText;
      console.log(`  🤖 AI transliteration: "${arabicText}" -> "${result}"`);
      return result;
    } catch (error) {
      console.error('AI transliteration error:', error);
      // Fallback to basic transliteration if AI fails
      return this.basicTransliterate(arabicText);
    }
  }

  /**
   * Basic fallback transliteration (character mapping)
   */
  private basicTransliterate(text: string): string {
    const map: Record<string, string> = {
      'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ء': "'",
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
      'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
      'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't',
      'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
      'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h',
      'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a',
    };

    let result = '';
    for (const char of text) {
      result += map[char] || (char === ' ' ? ' ' : '');
    }

    return result.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }

  /**
   * Convert Arabic-Indic numerals to Western numerals
   */
  convertArabicNumerals(text: string): string {
    if (!text) return '';

    const numeralMap: Record<string, string> = {
      // Arabic-Indic numerals
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
      // Extended Arabic-Indic numerals (Persian/Urdu)
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };

    let result = text;
    for (const [arabic, western] of Object.entries(numeralMap)) {
      result = result.replace(new RegExp(arabic, 'g'), western);
    }
    return result;
  }

  /**
   * Translate Lebanese ID data from Arabic to English using AI
   */
  async translateIdData(data: {
    first_name: string;
    last_name: string;
    dad_name: string;
    mom_full_name: string;
    birth_place: string;
    date_of_birth: string;
    government_id: string;
  }): Promise<{
    first_name: string;
    last_name: string;
    dad_name: string;
    mom_full_name: string;
    birth_place: string;
    date_of_birth: string;
    government_id: string;
  }> {
    console.log('🌐 Processing ID data with AI...');

    // Use AI to transliterate all names and places in parallel
    const [firstName, lastName, dadName, momFullName, birthPlace] = await Promise.all([
      this.transliterateWithAI(data.first_name, 'name'),
      this.transliterateWithAI(data.last_name, 'name'),
      this.transliterateWithAI(data.dad_name, 'name'),
      this.transliterateWithAI(data.mom_full_name, 'name'),
      this.transliterateWithAI(data.birth_place, 'place'),
    ]);

    // Convert Arabic numerals to Western numerals
    const dateOfBirth = this.convertArabicNumerals(data.date_of_birth);
    const governmentId = this.convertArabicNumerals(data.government_id);

    const translatedData = {
      first_name: firstName,
      last_name: lastName,
      dad_name: dadName,
      mom_full_name: momFullName,
      birth_place: birthPlace,
      date_of_birth: dateOfBirth,
      government_id: governmentId,
    };

    console.log('✅ AI Processed ID data:', JSON.stringify(translatedData, null, 2));

    return translatedData;
  }
}

export const translationService = new TranslationService();


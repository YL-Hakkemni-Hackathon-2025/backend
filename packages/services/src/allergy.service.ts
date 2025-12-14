import { AllergyModel, Allergy, AllergySeverity, AllergyType } from '@hakkemni/models';
import {
  CreateAllergyDto,
  UpdateAllergyDto,
  AllergyResponseDto,
  AllergySummaryDto
} from '@hakkemni/dto';
import { NotFoundError, ConflictError } from '@hakkemni/common';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini for allergy type inference
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const INFERENCE_MODEL = 'gemini-2.5-flash-lite';

export class AllergyService {
  /**
   * Infer allergy type from allergen name using AI
   */
  private async inferAllergyType(allergen: string): Promise<AllergyType> {
    try {
      const prompt = `Classify this allergen into one of these categories: drug, food, environmental, insect, latex, other.

Allergen: "${allergen}"

Respond with ONLY one word from: drug, food, environmental, insect, latex, other

Examples:
- "Penicillin" → drug
- "Peanuts" → food
- "Pollen" → environmental
- "Bee stings" → insect
- "Latex gloves" → latex`;

      const response = await ai.models.generateContent({
        model: INFERENCE_MODEL,
        contents: prompt,
        config: {
          temperature: 0 // Deterministic output for consistent results
        }
      });

      const result = response.text?.trim().toLowerCase();

      const typeMap: Record<string, AllergyType> = {
        'drug': AllergyType.DRUG,
        'food': AllergyType.FOOD,
        'environmental': AllergyType.ENVIRONMENTAL,
        'insect': AllergyType.INSECT,
        'latex': AllergyType.LATEX,
        'other': AllergyType.OTHER
      };

      return typeMap[result || ''] || AllergyType.OTHER;
    } catch (error) {
      console.error('Error inferring allergy type:', error);
      return AllergyType.OTHER;
    }
  }

  /**
   * Create a new allergy
   */
  async create(userId: string, dto: CreateAllergyDto): Promise<AllergyResponseDto> {
    // Check for duplicate (case-insensitive, active only)
    const existingAllergy = await AllergyModel.findOne({
      userId,
      allergen: { $regex: new RegExp(`^${dto.allergen.trim()}$`, 'i') },
      isActive: true
    });

    if (existingAllergy) {
      throw new ConflictError(`You already have "${dto.allergen}" in your allergies`);
    }

    // Infer allergy type from allergen name
    const inferredType = await this.inferAllergyType(dto.allergen);

    const allergy = await AllergyModel.create({
      userId,
      allergen: dto.allergen.trim(),
      type: inferredType,
      severity: dto.severity,
      diagnosedDate: dto.diagnosedDate,
      notes: dto.notes
    });

    return this.toResponseDto(allergy);
  }

  /**
   * Find all allergies for a user
   */
  async findByUserId(userId: string, activeOnly: boolean = true): Promise<AllergyResponseDto[]> {
    const query = activeOnly ? { userId, isActive: true } : { userId };
    const allergies = await AllergyModel.find(query).sort({ createdAt: -1 });
    return allergies.map(a => this.toResponseDto(a));
  }

  /**
   * Find allergy by ID
   */
  async findById(id: string): Promise<AllergyResponseDto> {
    const allergy = await AllergyModel.findById(id);
    if (!allergy) {
      throw new NotFoundError('Allergy not found');
    }
    return this.toResponseDto(allergy);
  }

  /**
   * Update allergy
   */
  async update(id: string, dto: UpdateAllergyDto): Promise<AllergyResponseDto> {
    // Get the current allergy to check userId
    const currentAllergy = await AllergyModel.findById(id);
    if (!currentAllergy) {
      throw new NotFoundError('Allergy not found');
    }

    // If allergen is being updated, check for duplicates and re-infer the type
    let updateData: any = { ...dto };
    if (dto.allergen) {
      const existingAllergy = await AllergyModel.findOne({
        userId: currentAllergy.userId,
        allergen: { $regex: new RegExp(`^${dto.allergen.trim()}$`, 'i') },
        isActive: true,
        _id: { $ne: id } // Exclude current record
      });

      if (existingAllergy) {
        throw new ConflictError(`You already have "${dto.allergen}" in your allergies`);
      }

      updateData.allergen = dto.allergen.trim();
      updateData.type = await this.inferAllergyType(dto.allergen);
    }

    const allergy = await AllergyModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!allergy) {
      throw new NotFoundError('Allergy not found');
    }

    return this.toResponseDto(allergy);
  }

  /**
   * Soft delete allergy
   */
  async delete(id: string): Promise<void> {
    const result = await AllergyModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } }
    );

    if (!result) {
      throw new NotFoundError('Allergy not found');
    }
  }

  /**
   * Get summaries for health pass
   */
  async getSummaries(userId: string, specificIds?: string[]): Promise<AllergySummaryDto[]> {
    let query: any = { userId, isActive: true };
    if (specificIds && specificIds.length > 0) {
      query._id = { $in: specificIds };
    }

    const allergies = await AllergyModel.find(query);
    return allergies.map(a => ({
      id: a._id.toString(),
      allergen: a.allergen,
      type: a.type as any,
      severity: a.severity as any
    }));
  }

  private toResponseDto(allergy: Allergy): AllergyResponseDto {
    return {
      id: allergy._id.toString(),
      userId: allergy.userId.toString(),
      allergen: allergy.allergen,
      type: allergy.type as any,
      severity: allergy.severity as any,
      diagnosedDate: allergy.diagnosedDate,
      notes: allergy.notes,
      isActive: allergy.isActive,
      createdAt: allergy.createdAt,
      updatedAt: allergy.updatedAt
    };
  }
}

export const allergyService = new AllergyService();


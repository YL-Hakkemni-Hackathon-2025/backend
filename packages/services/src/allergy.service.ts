import { AllergyModel, Allergy, AllergySeverity, AllergyType } from '@hakkemni/models';
import {
  CreateAllergyDto,
  UpdateAllergyDto,
  AllergyResponseDto,
  AllergySummaryDto
} from '@hakkemni/dto';
import { NotFoundError } from '@hakkemni/common';

export class AllergyService {
  /**
   * Create a new allergy
   */
  async create(userId: string, dto: CreateAllergyDto): Promise<AllergyResponseDto> {
    const allergy = await AllergyModel.create({
      userId,
      allergen: dto.allergen,
      type: dto.type,
      severity: dto.severity,
      reaction: dto.reaction,
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
    const allergy = await AllergyModel.findByIdAndUpdate(
      id,
      { $set: dto },
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
      reaction: allergy.reaction,
      diagnosedDate: allergy.diagnosedDate,
      notes: allergy.notes,
      isActive: allergy.isActive,
      createdAt: allergy.createdAt,
      updatedAt: allergy.updatedAt
    };
  }
}

export const allergyService = new AllergyService();


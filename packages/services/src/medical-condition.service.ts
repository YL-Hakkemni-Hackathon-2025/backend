import { MedicalConditionModel, MedicalCondition } from '@hakkemni/models';
import {
  CreateMedicalConditionDto,
  UpdateMedicalConditionDto,
  MedicalConditionResponseDto,
  MedicalConditionSummaryDto
} from '@hakkemni/dto';
import { NotFoundError } from '@hakkemni/common';

export class MedicalConditionService {
  /**
   * Create a new medical condition
   */
  async create(userId: string, dto: CreateMedicalConditionDto): Promise<MedicalConditionResponseDto> {
    const condition = await MedicalConditionModel.create({
      userId,
      name: dto.name,
      diagnosedDate: dto.diagnosedDate,
      notes: dto.notes
    });

    return this.toResponseDto(condition);
  }

  /**
   * Find all conditions for a user
   */
  async findByUserId(userId: string, activeOnly: boolean = true): Promise<MedicalConditionResponseDto[]> {
    const query = activeOnly ? { userId, isActive: true } : { userId };
    const conditions = await MedicalConditionModel.find(query).sort({ createdAt: -1 });
    return conditions.map(c => this.toResponseDto(c));
  }

  /**
   * Find condition by ID
   */
  async findById(id: string): Promise<MedicalConditionResponseDto> {
    const condition = await MedicalConditionModel.findById(id);
    if (!condition) {
      throw new NotFoundError('Medical condition not found');
    }
    return this.toResponseDto(condition);
  }

  /**
   * Update condition
   */
  async update(id: string, dto: UpdateMedicalConditionDto): Promise<MedicalConditionResponseDto> {
    const condition = await MedicalConditionModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true }
    );

    if (!condition) {
      throw new NotFoundError('Medical condition not found');
    }

    return this.toResponseDto(condition);
  }

  /**
   * Soft delete condition
   */
  async delete(id: string): Promise<void> {
    const result = await MedicalConditionModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } }
    );

    if (!result) {
      throw new NotFoundError('Medical condition not found');
    }
  }

  /**
   * Get summaries for health pass
   */
  async getSummaries(userId: string, specificIds?: string[]): Promise<MedicalConditionSummaryDto[]> {
    let query: any = { userId, isActive: true };
    if (specificIds && specificIds.length > 0) {
      query._id = { $in: specificIds };
    }

    const conditions = await MedicalConditionModel.find(query);
    return conditions.map(c => ({
      id: c._id.toString(),
      name: c.name,
      diagnosedDate: c.diagnosedDate
    }));
  }

  private toResponseDto(condition: MedicalCondition): MedicalConditionResponseDto {
    return {
      id: condition._id.toString(),
      userId: condition.userId.toString(),
      name: condition.name,
      diagnosedDate: condition.diagnosedDate,
      notes: condition.notes,
      isActive: condition.isActive,
      createdAt: condition.createdAt,
      updatedAt: condition.updatedAt
    };
  }
}

export const medicalConditionService = new MedicalConditionService();


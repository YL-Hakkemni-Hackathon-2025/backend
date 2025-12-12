import { LifestyleModel, Lifestyle } from '@hakkemni/models';
import {
  CreateLifestyleDto,
  UpdateLifestyleDto,
  LifestyleResponseDto,
  LifestyleSummaryDto
} from '@hakkemni/dto';
import { NotFoundError, LifestyleCategory } from '@hakkemni/common';

export class LifestyleService {
  /**
   * Create a new lifestyle choice
   */
  async create(userId: string, dto: CreateLifestyleDto): Promise<LifestyleResponseDto> {
    const lifestyle = await LifestyleModel.create({
      userId,
      category: dto.category,
      description: dto.description,
      frequency: dto.frequency,
      startDate: dto.startDate,
      notes: dto.notes
    });

    return this.toResponseDto(lifestyle);
  }

  /**
   * Find all lifestyle choices for a user
   */
  async findByUserId(userId: string, activeOnly: boolean = true): Promise<LifestyleResponseDto[]> {
    const query = activeOnly ? { userId, isActive: true } : { userId };
    const lifestyles = await LifestyleModel.find(query).sort({ createdAt: -1 });
    return lifestyles.map(l => this.toResponseDto(l));
  }

  /**
   * Find lifestyle by ID
   */
  async findById(id: string): Promise<LifestyleResponseDto> {
    const lifestyle = await LifestyleModel.findById(id);
    if (!lifestyle) {
      throw new NotFoundError('Lifestyle choice not found');
    }
    return this.toResponseDto(lifestyle);
  }

  /**
   * Update lifestyle
   */
  async update(id: string, dto: UpdateLifestyleDto): Promise<LifestyleResponseDto> {
    const lifestyle = await LifestyleModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true }
    );

    if (!lifestyle) {
      throw new NotFoundError('Lifestyle choice not found');
    }

    return this.toResponseDto(lifestyle);
  }

  /**
   * Soft delete lifestyle
   */
  async delete(id: string): Promise<void> {
    const result = await LifestyleModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } }
    );

    if (!result) {
      throw new NotFoundError('Lifestyle choice not found');
    }
  }

  /**
   * Get summaries for health pass
   */
  async getSummaries(userId: string): Promise<LifestyleSummaryDto[]> {
    const lifestyles = await LifestyleModel.find({ userId, isActive: true });
    return lifestyles.map(l => ({
      id: l._id.toString(),
      category: l.category as LifestyleCategory,
      description: l.description
    }));
  }

  private toResponseDto(lifestyle: Lifestyle): LifestyleResponseDto {
    return {
      id: lifestyle._id.toString(),
      userId: lifestyle.userId.toString(),
      category: lifestyle.category as LifestyleCategory,
      description: lifestyle.description,
      frequency: lifestyle.frequency,
      startDate: lifestyle.startDate,
      notes: lifestyle.notes,
      isActive: lifestyle.isActive,
      createdAt: lifestyle.createdAt,
      updatedAt: lifestyle.updatedAt
    };
  }
}

export const lifestyleService = new LifestyleService();


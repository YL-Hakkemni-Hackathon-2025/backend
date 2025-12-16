import { LifestyleModel, Lifestyle, LifestyleHabit as LifestyleHabitModel } from '@hakkemni/models';
import {
  UpdateLifestyleDto,
  LifestyleResponseDto,
  LifestyleSummaryDto,
  HabitResponseDto,
  HabitSummaryDto,
  HabitDto
} from '@hakkemni/dto';
import { NotFoundError, LifestyleCategory, HabitFrequency } from '@hakkemni/common';

export class LifestyleService {
  /**
   * Get or create lifestyle for a user
   */
  async getOrCreate(userId: string): Promise<LifestyleResponseDto> {
    let lifestyle = await LifestyleModel.findOne({ userId, isActive: true });

    if (!lifestyle) {
      // Create a new lifestyle with default habits
      lifestyle = await LifestyleModel.create({
        userId,
        habits: this.getDefaultHabits()
      });
    }

    return this.toResponseDto(lifestyle);
  }

  /**
   * Find lifestyle for a user
   */
  async findByUserId(userId: string): Promise<LifestyleResponseDto | null> {
    const lifestyle = await LifestyleModel.findOne({ userId, isActive: true });
    if (!lifestyle) {
      return null;
    }
    return this.toResponseDto(lifestyle);
  }

  /**
   * Find lifestyle by ID
   */
  async findById(id: string): Promise<LifestyleResponseDto> {
    const lifestyle = await LifestyleModel.findById(id);
    if (!lifestyle) {
      throw new NotFoundError('Lifestyle not found');
    }
    return this.toResponseDto(lifestyle);
  }

  /**
   * Update lifestyle habits (upsert - create if not exists)
   */
  async update(userId: string, dto: UpdateLifestyleDto): Promise<LifestyleResponseDto> {
    let lifestyle = await LifestyleModel.findOne({ userId, isActive: true });

    if (!lifestyle) {
      // Create new lifestyle with provided habits
      lifestyle = await LifestyleModel.create({
        userId,
        habits: dto.habits
      });
    } else {
      // Update existing lifestyle habits
      lifestyle = await LifestyleModel.findOneAndUpdate(
        { userId, isActive: true },
        { $set: { habits: dto.habits } },
        { new: true }
      );
    }

    if (!lifestyle) {
      throw new NotFoundError('Failed to update lifestyle');
    }

    return this.toResponseDto(lifestyle);
  }

  /**
   * Update a single habit
   */
  async updateHabit(userId: string, category: LifestyleCategory, frequency: HabitFrequency, notes?: string): Promise<LifestyleResponseDto> {
    let lifestyle = await LifestyleModel.findOne({ userId, isActive: true });

    if (!lifestyle) {
      // Create new lifestyle with this habit
      lifestyle = await LifestyleModel.create({
        userId,
        habits: [{ category, frequency, notes }]
      });
    } else {
      // Check if habit already exists
      const habitIndex = lifestyle.habits.findIndex(h => h.category === category);

      if (habitIndex >= 0) {
        // Update existing habit
        lifestyle.habits[habitIndex].frequency = frequency;
        if (notes !== undefined) {
          lifestyle.habits[habitIndex].notes = notes;
        }
      } else {
        // Add new habit
        lifestyle.habits.push({ category, frequency, notes } as LifestyleHabitModel);
      }

      await lifestyle.save();
    }

    return this.toResponseDto(lifestyle);
  }

  /**
   * Soft delete lifestyle
   */
  async delete(userId: string): Promise<void> {
    const result = await LifestyleModel.findOneAndUpdate(
      { userId, isActive: true },
      { $set: { isActive: false } }
    );

    if (!result) {
      throw new NotFoundError('Lifestyle not found');
    }
  }

  /**
   * Get summaries for health pass - returns all habits with their frequencies
   */
  async getSummaries(userId: string, specificCategories?: LifestyleCategory[]): Promise<LifestyleSummaryDto | null> {
    const lifestyle = await LifestyleModel.findOne({ userId, isActive: true });
    if (!lifestyle) {
      return null;
    }

    let habits = lifestyle.habits.filter(h => h.frequency !== HabitFrequency.NOT_SET);

    if (specificCategories && specificCategories.length > 0) {
      habits = habits.filter(h => specificCategories.includes(h.category));
    }

    return {
      id: lifestyle._id.toString(),
      habits: habits.map(h => ({
        category: h.category as LifestyleCategory,
        frequency: h.frequency as HabitFrequency,
        notes: h.notes
      }))
    };
  }

  /**
   * Get all habits for a user (used for AI analysis)
   */
  async getHabits(userId: string): Promise<HabitResponseDto[]> {
    const lifestyle = await LifestyleModel.findOne({ userId, isActive: true });
    if (!lifestyle) {
      return [];
    }

    return lifestyle.habits
      .filter(h => h.frequency !== HabitFrequency.NOT_SET)
      .map(h => ({
        category: h.category as LifestyleCategory,
        frequency: h.frequency as HabitFrequency,
        notes: h.notes
      }));
  }

  /**
   * Get default habits with NOT_SET frequency
   */
  private getDefaultHabits(): HabitDto[] {
    return [
      { category: LifestyleCategory.SMOKING, frequency: HabitFrequency.NOT_SET },
      { category: LifestyleCategory.ALCOHOL, frequency: HabitFrequency.NOT_SET },
      { category: LifestyleCategory.EXERCISE, frequency: HabitFrequency.NOT_SET },
      { category: LifestyleCategory.SLEEP, frequency: HabitFrequency.NOT_SET },
      { category: LifestyleCategory.STRESS, frequency: HabitFrequency.NOT_SET }
    ];
  }

  private toResponseDto(lifestyle: Lifestyle): LifestyleResponseDto {
    return {
      id: lifestyle._id.toString(),
      userId: lifestyle.userId.toString(),
      habits: lifestyle.habits.map(h => ({
        category: h.category as LifestyleCategory,
        frequency: h.frequency as HabitFrequency,
        notes: h.notes
      })),
      isActive: lifestyle.isActive,
      createdAt: lifestyle.createdAt,
      updatedAt: lifestyle.updatedAt
    };
  }
}

export const lifestyleService = new LifestyleService();

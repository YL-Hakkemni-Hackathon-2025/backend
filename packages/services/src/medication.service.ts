import { MedicationModel, Medication } from '@hakkemni/models';
import {
  CreateMedicationDto,
  UpdateMedicationDto,
  MedicationResponseDto,
  MedicationSummaryDto
} from '@hakkemni/dto';
import { NotFoundError, MedicationFrequency } from '@hakkemni/common';

export class MedicationService {
  /**
   * Create a new medication
   */
  async create(userId: string, dto: CreateMedicationDto): Promise<MedicationResponseDto> {
    const medication = await MedicationModel.create({
      userId,
      medicationName: dto.medicationName,
      dosageAmount: dto.dosageAmount,
      frequency: dto.frequency,
      startDate: dto.startDate,
      endDate: dto.endDate,
      notes: dto.notes
    });

    return this.toResponseDto(medication);
  }

  /**
   * Find all medications for a user
   */
  async findByUserId(userId: string, activeOnly: boolean = true): Promise<MedicationResponseDto[]> {
    const query = activeOnly ? { userId, isActive: true } : { userId };
    const medications = await MedicationModel.find(query).sort({ createdAt: -1 });
    return medications.map(m => this.toResponseDto(m));
  }

  /**
   * Find medication by ID
   */
  async findById(id: string): Promise<MedicationResponseDto> {
    const medication = await MedicationModel.findById(id);
    if (!medication) {
      throw new NotFoundError('Medication not found');
    }
    return this.toResponseDto(medication);
  }

  /**
   * Update medication
   */
  async update(id: string, dto: UpdateMedicationDto): Promise<MedicationResponseDto> {
    const medication = await MedicationModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true }
    );

    if (!medication) {
      throw new NotFoundError('Medication not found');
    }

    return this.toResponseDto(medication);
  }

  /**
   * Soft delete medication
   */
  async delete(id: string): Promise<void> {
    const result = await MedicationModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } }
    );

    if (!result) {
      throw new NotFoundError('Medication not found');
    }
  }

  /**
   * Get summaries for health pass
   */
  async getSummaries(userId: string, specificIds?: string[]): Promise<MedicationSummaryDto[]> {
    let query: any = { userId, isActive: true };
    if (specificIds && specificIds.length > 0) {
      query._id = { $in: specificIds };
    }

    const medications = await MedicationModel.find(query);
    return medications.map(m => ({
      id: m._id.toString(),
      medicationName: m.medicationName,
      dosageAmount: m.dosageAmount,
      frequency: m.frequency
    }));
  }

  private toResponseDto(medication: Medication): MedicationResponseDto {
    return {
      id: medication._id.toString(),
      userId: medication.userId.toString(),
      medicationName: medication.medicationName,
      dosageAmount: medication.dosageAmount,
      frequency: medication.frequency as MedicationFrequency,
      startDate: medication.startDate,
      endDate: medication.endDate,
      notes: medication.notes,
      isActive: medication.isActive,
      createdAt: medication.createdAt,
      updatedAt: medication.updatedAt
    };
  }
}

export const medicationService = new MedicationService();


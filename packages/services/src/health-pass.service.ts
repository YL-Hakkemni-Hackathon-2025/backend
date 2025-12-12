import { HealthPassModel, HealthPass } from '@hakkemni/models';
import {
  CreateHealthPassDto,
  UpdateHealthPassDto,
  HealthPassResponseDto,
  HealthPassPreviewDto,
  HealthPassSummaryDto,
  AiHealthPassSuggestionsDto
} from '@hakkemni/dto';
import {
  NotFoundError,
  AppointmentSpecialty,
  HealthPassStatus,
  HEALTH_PASS_EXPIRY_HOURS
} from '@hakkemni/common';
import { v4 as uuidv4 } from 'uuid';
import { userService } from './user.service';
import { medicalConditionService } from './medical-condition.service';
import { medicationService } from './medication.service';
import { allergyService } from './allergy.service';
import { lifestyleService } from './lifestyle.service';
import { documentService } from './document.service';
import { qrCodeService } from './qr-code.service';
import { aiService } from './ai.service';

export class HealthPassService {
  /**
   * Create a new health pass with AI suggestions
   */
  async create(userId: string, dto: CreateHealthPassDto): Promise<HealthPassResponseDto> {
    // Gather all user health data for AI analysis
    const [conditions, medications, allergies, lifestyles, documents] = await Promise.all([
      medicalConditionService.findByUserId(userId),
      medicationService.findByUserId(userId),
      allergyService.findByUserId(userId),
      lifestyleService.findByUserId(userId),
      documentService.findByUserId(userId)
    ]);

    // Get AI recommendations for which data to share based on appointment type
    const aiSuggestions = await aiService.generateHealthPassRecommendations(
      dto.appointmentSpecialty,
      { conditions, medications, allergies, lifestyles, documents }
    );

    // Generate unique codes
    const accessCode = uuidv4();
    const expiresAt = new Date(Date.now() + HEALTH_PASS_EXPIRY_HOURS * 60 * 60 * 1000);

    // Generate QR code
    const qrCode = await qrCodeService.generateQrCode(accessCode);

    // Merge user toggles with AI suggestions
    const dataToggles = {
      name: true as const,
      gender: true as const,
      dateOfBirth: true as const,
      medicalConditions: dto.dataToggles?.medicalConditions ?? aiSuggestions.suggestedToggles.medicalConditions,
      medications: dto.dataToggles?.medications ?? aiSuggestions.suggestedToggles.medications,
      allergies: dto.dataToggles?.allergies ?? aiSuggestions.suggestedToggles.allergies,
      lifestyleChoices: dto.dataToggles?.lifestyleChoices ?? aiSuggestions.suggestedToggles.lifestyleChoices,
      documents: dto.dataToggles?.documents ?? aiSuggestions.suggestedToggles.documents,
      specificConditions: dto.dataToggles?.specificConditions ?? aiSuggestions.suggestedToggles.specificConditions,
      specificMedications: dto.dataToggles?.specificMedications ?? aiSuggestions.suggestedToggles.specificMedications,
      specificAllergies: dto.dataToggles?.specificAllergies ?? aiSuggestions.suggestedToggles.specificAllergies,
      specificDocuments: dto.dataToggles?.specificDocuments ?? aiSuggestions.suggestedToggles.specificDocuments
    };

    const healthPass = await HealthPassModel.create({
      userId,
      appointmentSpecialty: dto.appointmentSpecialty,
      appointmentDate: dto.appointmentDate,
      appointmentNotes: dto.appointmentNotes,
      qrCode,
      accessCode,
      status: HealthPassStatus.GENERATED,
      dataToggles,
      aiRecommendations: aiSuggestions.recommendations,
      aiSuggestedToggles: Object.keys(aiSuggestions.suggestedToggles)
        .filter(k => (aiSuggestions.suggestedToggles as any)[k] === true),
      expiresAt
    });

    return this.toResponseDto(healthPass);
  }

  /**
   * Get health pass by ID
   */
  async findById(id: string): Promise<HealthPassResponseDto> {
    const healthPass = await HealthPassModel.findById(id);
    if (!healthPass) {
      throw new NotFoundError('Health pass not found');
    }
    return this.toResponseDto(healthPass);
  }

  /**
   * Get health pass by access code (for doctor scanning QR code)
   */
  async findByAccessCode(accessCode: string): Promise<HealthPassPreviewDto> {
    const healthPass = await HealthPassModel.findOne({ accessCode });
    if (!healthPass) {
      throw new NotFoundError('Health pass not found');
    }

    // Check if expired
    if (new Date() > healthPass.expiresAt) {
      await HealthPassModel.findByIdAndUpdate(healthPass._id, {
        $set: { status: HealthPassStatus.EXPIRED }
      });
      throw new NotFoundError('Health pass has expired');
    }

    // Update access tracking
    await HealthPassModel.findByIdAndUpdate(healthPass._id, {
      $set: { lastAccessedAt: new Date(), status: HealthPassStatus.SHARED },
      $inc: { accessCount: 1 }
    });

    return this.generatePreview(healthPass);
  }

  /**
   * Generate preview of health pass data
   */
  private async generatePreview(healthPass: HealthPass): Promise<HealthPassPreviewDto> {
    const user = await userService.findById(healthPass.userId.toString());
    const toggles = healthPass.dataToggles;

    const preview: HealthPassPreviewDto = {
      patientName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      appointmentSpecialty: healthPass.appointmentSpecialty as AppointmentSpecialty,
      appointmentDate: healthPass.appointmentDate,
      appointmentNotes: healthPass.appointmentNotes,
      aiRecommendations: healthPass.aiRecommendations
    };

    const userId = healthPass.userId.toString();

    if (toggles.medicalConditions) {
      preview.medicalConditions = await medicalConditionService.getSummaries(
        userId,
        toggles.specificConditions
      );
    }

    if (toggles.medications) {
      preview.medications = await medicationService.getSummaries(
        userId,
        toggles.specificMedications
      );
    }

    if (toggles.allergies) {
      preview.allergies = await allergyService.getSummaries(
        userId,
        toggles.specificAllergies
      );
    }

    if (toggles.lifestyleChoices) {
      preview.lifestyleChoices = await lifestyleService.getSummaries(userId);
    }

    if (toggles.documents) {
      preview.documents = await documentService.getSummaries(
        userId,
        toggles.specificDocuments
      );
    }

    return preview;
  }

  /**
   * Update health pass
   */
  async update(id: string, dto: UpdateHealthPassDto): Promise<HealthPassResponseDto> {
    const updateData: any = { ...dto };

    // Ensure required toggles cannot be turned off
    if (updateData.dataToggles) {
      updateData.dataToggles.name = true;
      updateData.dataToggles.gender = true;
      updateData.dataToggles.dateOfBirth = true;
    }

    const healthPass = await HealthPassModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!healthPass) {
      throw new NotFoundError('Health pass not found');
    }

    return this.toResponseDto(healthPass);
  }

  /**
   * Find all health passes for a user
   */
  async findByUserId(userId: string): Promise<HealthPassSummaryDto[]> {
    const passes = await HealthPassModel.find({ userId }).sort({ createdAt: -1 });
    return passes.map(p => ({
      id: p._id.toString(),
      appointmentSpecialty: p.appointmentSpecialty as AppointmentSpecialty,
      appointmentDate: p.appointmentDate,
      status: p.status as HealthPassStatus,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt
    }));
  }

  /**
   * Regenerate QR code for health pass
   */
  async regenerateQrCode(id: string): Promise<string> {
    const healthPass = await HealthPassModel.findById(id);
    if (!healthPass) {
      throw new NotFoundError('Health pass not found');
    }

    const newAccessCode = uuidv4();
    const newQrCode = await qrCodeService.generateQrCode(newAccessCode);
    const newExpiresAt = new Date(Date.now() + HEALTH_PASS_EXPIRY_HOURS * 60 * 60 * 1000);

    await HealthPassModel.findByIdAndUpdate(id, {
      $set: {
        accessCode: newAccessCode,
        qrCode: newQrCode,
        expiresAt: newExpiresAt,
        status: HealthPassStatus.GENERATED
      }
    });

    return newQrCode;
  }

  private toResponseDto(healthPass: HealthPass): HealthPassResponseDto {
    return {
      id: healthPass._id.toString(),
      userId: healthPass.userId.toString(),
      appointmentSpecialty: healthPass.appointmentSpecialty as AppointmentSpecialty,
      appointmentDate: healthPass.appointmentDate,
      appointmentNotes: healthPass.appointmentNotes,
      qrCode: healthPass.qrCode,
      accessCode: healthPass.accessCode,
      status: healthPass.status as HealthPassStatus,
      dataToggles: healthPass.dataToggles,
      aiRecommendations: healthPass.aiRecommendations,
      aiSuggestedToggles: healthPass.aiSuggestedToggles,
      expiresAt: healthPass.expiresAt,
      lastAccessedAt: healthPass.lastAccessedAt,
      accessCount: healthPass.accessCount,
      createdAt: healthPass.createdAt,
      updatedAt: healthPass.updatedAt
    };
  }
}

export const healthPassService = new HealthPassService();

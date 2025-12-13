import { HealthPassModel, HealthPass } from '@hakkemni/models';
import {
  CreateHealthPassDto,
  UpdateHealthPassDto,
  HealthPassResponseDto,
  HealthPassPreviewDto,
  HealthPassSummaryDto,
  AiHealthPassSuggestionsDto,
  HealthPassMedicalConditionItemDto,
  HealthPassMedicationItemDto,
  HealthPassAllergyItemDto,
  HealthPassLifestyleItemDto,
  HealthPassDocumentItemDto,
  MedicalConditionResponseDto,
  MedicationResponseDto,
  AllergyResponseDto,
  LifestyleResponseDto,
  DocumentResponseDto
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
    const [user, conditions, medications, allergies, lifestyles, documents] = await Promise.all([
      userService.findById(userId),
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

    // Build data toggles from AI suggestions (for storage)
    const dataToggles = {
      name: true as const,
      gender: true as const,
      dateOfBirth: true as const,
      medicalConditions: true,
      medications: true,
      allergies: true,
      lifestyleChoices: true,
      documents: true,
      specificConditions: aiSuggestions.conditionRecommendations.filter(r => r.isRelevant).map(r => r.id),
      specificMedications: aiSuggestions.medicationRecommendations.filter(r => r.isRelevant).map(r => r.id),
      specificAllergies: aiSuggestions.allergyRecommendations.filter(r => r.isRelevant).map(r => r.id),
      specificLifestyles: aiSuggestions.lifestyleRecommendations.filter(r => r.isRelevant).map(r => r.id),
      specificDocuments: aiSuggestions.documentRecommendations.filter(r => r.isRelevant).map(r => r.id)
    };

    // Filter toggled items for profile summary
    const toggledConditions = conditions.filter(c => dataToggles.specificConditions.includes(c.id));
    const toggledMedications = medications.filter(m => dataToggles.specificMedications.includes(m.id));
    const toggledAllergies = allergies.filter(a => dataToggles.specificAllergies.includes(a.id));
    const toggledLifestyles = lifestyles.filter(l => dataToggles.specificLifestyles.includes(l.id));
    const toggledDocuments = documents.filter(d => dataToggles.specificDocuments.includes(d.id));

    // Generate AI profile summary based on toggled items
    const aiProfileSummary = await aiService.generateProfileSummary(
      dto.appointmentSpecialty,
      {
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender
      },
      {
        conditions: toggledConditions,
        medications: toggledMedications,
        allergies: toggledAllergies,
        lifestyles: toggledLifestyles,
        documents: toggledDocuments
      }
    );

    const healthPass = await HealthPassModel.create({
      userId,
      appointmentSpecialty: dto.appointmentSpecialty,
      appointmentDate: dto.appointmentDate,
      appointmentNotes: dto.appointmentNotes,
      qrCode,
      accessCode,
      status: HealthPassStatus.GENERATED,
      dataToggles,
      aiRecommendations: aiSuggestions.overallRecommendation,
      aiProfileSummary,
      aiItemRecommendations: {
        conditionRecommendations: aiSuggestions.conditionRecommendations,
        medicationRecommendations: aiSuggestions.medicationRecommendations,
        allergyRecommendations: aiSuggestions.allergyRecommendations,
        lifestyleRecommendations: aiSuggestions.lifestyleRecommendations,
        documentRecommendations: aiSuggestions.documentRecommendations
      },
      expiresAt
    });

    // Build populated response with AI recommendations per item
    return this.buildHealthPassResponse(
      healthPass,
      conditions,
      medications,
      allergies,
      lifestyles,
      documents,
      aiSuggestions
    );
  }

  /**
   * Get health pass by ID
   */
  async findById(id: string): Promise<HealthPassResponseDto> {
    const healthPass = await HealthPassModel.findById(id);
    if (!healthPass) {
      throw new NotFoundError('Health pass not found');
    }

    const userId = healthPass.userId.toString();

    // Fetch all health data
    const [conditions, medications, allergies, lifestyles, documents] = await Promise.all([
      medicalConditionService.findByUserId(userId),
      medicationService.findByUserId(userId),
      allergyService.findByUserId(userId),
      lifestyleService.findByUserId(userId),
      documentService.findByUserId(userId)
    ]);

    // Use stored AI suggestions from database
    const aiSuggestions: AiHealthPassSuggestionsDto = {
      conditionRecommendations: healthPass.aiItemRecommendations?.conditionRecommendations || [],
      medicationRecommendations: healthPass.aiItemRecommendations?.medicationRecommendations || [],
      allergyRecommendations: healthPass.aiItemRecommendations?.allergyRecommendations || [],
      lifestyleRecommendations: healthPass.aiItemRecommendations?.lifestyleRecommendations || [],
      documentRecommendations: healthPass.aiItemRecommendations?.documentRecommendations || [],
      overallRecommendation: healthPass.aiRecommendations || ''
    };

    return this.buildHealthPassResponse(
      healthPass,
      conditions,
      medications,
      allergies,
      lifestyles,
      documents,
      aiSuggestions
    );
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
   * Generate preview of health pass data (for doctor's view when scanning QR)
   */
  private async generatePreview(healthPass: HealthPass): Promise<HealthPassPreviewDto> {
    const userId = healthPass.userId.toString();
    const toggles = healthPass.dataToggles;

    // Fetch user and all health data
    const [user, conditions, medications, allergies, lifestyles, documents] = await Promise.all([
      userService.findById(userId),
      medicalConditionService.findByUserId(userId),
      medicationService.findByUserId(userId),
      allergyService.findByUserId(userId),
      lifestyleService.findByUserId(userId),
      documentService.findByUserId(userId)
    ]);

    // Use stored AI suggestions from database
    const storedRecommendations = healthPass.aiItemRecommendations;

    const preview: HealthPassPreviewDto = {
      patientName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      appointmentSpecialty: healthPass.appointmentSpecialty as AppointmentSpecialty,
      appointmentDate: healthPass.appointmentDate,
      appointmentNotes: healthPass.appointmentNotes,
      aiRecommendations: healthPass.aiRecommendations,
      aiProfileSummary: healthPass.aiProfileSummary
    };

    // Build medical conditions with AI recommendations (only toggled ones)
    if (toggles.medicalConditions && toggles.specificConditions) {
      const filteredConditions = conditions.filter(c => toggles.specificConditions!.includes(c.id));
      preview.medicalConditions = filteredConditions.map(c => {
        const rec = storedRecommendations?.conditionRecommendations?.find(r => r.id === c.id);
        return {
          id: c.id,
          name: c.name,
          diagnosedDate: c.diagnosedDate,
          notes: c.notes,
          aiRecommendation: rec?.recommendation
        };
      });
    }

    // Build medications with AI recommendations (only toggled ones)
    if (toggles.medications && toggles.specificMedications) {
      const filteredMedications = medications.filter(m => toggles.specificMedications!.includes(m.id));
      preview.medications = filteredMedications.map(m => {
        const rec = storedRecommendations?.medicationRecommendations?.find(r => r.id === m.id);
        return {
          id: m.id,
          medicationName: m.medicationName,
          dosageAmount: m.dosageAmount,
          frequency: m.frequency,
          notes: m.notes,
          aiRecommendation: rec?.recommendation
        };
      });
    }

    // Build allergies with AI recommendations (only toggled ones)
    if (toggles.allergies && toggles.specificAllergies) {
      const filteredAllergies = allergies.filter(a => toggles.specificAllergies!.includes(a.id));
      preview.allergies = filteredAllergies.map(a => {
        const rec = storedRecommendations?.allergyRecommendations?.find(r => r.id === a.id);
        return {
          id: a.id,
          allergen: a.allergen,
          type: a.type,
          severity: a.severity,
          reaction: a.reaction,
          aiRecommendation: rec?.recommendation
        };
      });
    }

    // Build lifestyle choices with AI recommendations (only toggled ones)
    if (toggles.lifestyleChoices && toggles.specificLifestyles) {
      const filteredLifestyles = lifestyles.filter(l => toggles.specificLifestyles!.includes(l.id));
      preview.lifestyleChoices = filteredLifestyles.map(l => {
        const rec = storedRecommendations?.lifestyleRecommendations?.find(r => r.id === l.id);
        return {
          id: l.id,
          category: l.category,
          description: l.description,
          frequency: l.frequency,
          aiRecommendation: rec?.recommendation
        };
      });
    }

    // Build documents with AI recommendations (only toggled ones)
    if (toggles.documents && toggles.specificDocuments) {
      const filteredDocuments = documents.filter(d => toggles.specificDocuments!.includes(d.id));
      preview.documents = filteredDocuments.map(d => {
        const rec = storedRecommendations?.documentRecommendations?.find(r => r.id === d.id);
        return {
          id: d.id,
          documentName: d.documentName,
          documentType: d.documentType,
          documentDate: d.documentDate,
          notes: d.notes,
          fileUrl: d.fileUrl,
          aiRecommendation: rec?.recommendation
        };
      });
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

    // Return the populated response via findById
    return this.findById(id);
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

  /**
   * Toggle a specific item in a health pass
   * @param id Health pass ID
   * @param itemType Type of item (medicalCondition, medication, allergy, lifestyle, document)
   * @param itemId ID of the specific item
   * @param isEnabled Whether to enable or disable the item
   */
  async toggleItem(
    id: string,
    itemType: 'medicalCondition' | 'medication' | 'allergy' | 'lifestyle' | 'document',
    itemId: string,
    isEnabled: boolean
  ): Promise<HealthPassResponseDto> {
    const healthPass = await HealthPassModel.findById(id);
    if (!healthPass) {
      throw new NotFoundError('Health pass not found');
    }

    // Map item type to the corresponding array field in dataToggles
    const fieldMap: Record<string, string> = {
      medicalCondition: 'specificConditions',
      medication: 'specificMedications',
      allergy: 'specificAllergies',
      lifestyle: 'specificLifestyles',
      document: 'specificDocuments'
    };

    const field = fieldMap[itemType];
    if (!field) {
      throw new Error('Invalid item type');
    }

    const currentToggles = healthPass.dataToggles || {};
    const currentArray: string[] = (currentToggles as any)[field] || [];

    let updatedArray: string[];
    if (isEnabled) {
      // Add itemId if not already present
      if (!currentArray.includes(itemId)) {
        updatedArray = [...currentArray, itemId];
      } else {
        updatedArray = currentArray;
      }
    } else {
      // Remove itemId if present
      updatedArray = currentArray.filter(id => id !== itemId);
    }

    // Update the health pass
    await HealthPassModel.findByIdAndUpdate(id, {
      $set: {
        [`dataToggles.${field}`]: updatedArray
      }
    });

    // Return the updated health pass
    return this.findById(id);
  }

  private toResponseDto(healthPass: HealthPass): HealthPassResponseDto {
    // This method is no longer used but kept for compatibility
    // Use buildHealthPassResponse instead
    throw new Error('Use buildHealthPassResponse instead');
  }

  /**
   * Build populated health pass response with AI recommendations per item
   */
  private buildHealthPassResponse(
    healthPass: HealthPass,
    conditions: MedicalConditionResponseDto[],
    medications: MedicationResponseDto[],
    allergies: AllergyResponseDto[],
    lifestyles: LifestyleResponseDto[],
    documents: DocumentResponseDto[],
    aiSuggestions: AiHealthPassSuggestionsDto
  ): HealthPassResponseDto {
    // Map conditions with AI recommendations
    const medicalConditionsItems: HealthPassMedicalConditionItemDto[] = conditions.map(c => {
      const rec = aiSuggestions.conditionRecommendations.find(r => r.id === c.id);
      return {
        data: c,
        isRelevant: rec?.isRelevant ?? true,
        aiRecommendation: rec?.recommendation ?? 'Recommended to share with your doctor.'
      };
    });

    // Map medications with AI recommendations
    const medicationsItems: HealthPassMedicationItemDto[] = medications.map(m => {
      const rec = aiSuggestions.medicationRecommendations.find(r => r.id === m.id);
      return {
        data: m,
        isRelevant: rec?.isRelevant ?? true,
        aiRecommendation: rec?.recommendation ?? 'Recommended to share with your doctor.'
      };
    });

    // Map allergies with AI recommendations
    const allergiesItems: HealthPassAllergyItemDto[] = allergies.map(a => {
      const rec = aiSuggestions.allergyRecommendations.find(r => r.id === a.id);
      return {
        data: a,
        isRelevant: rec?.isRelevant ?? true,
        aiRecommendation: rec?.recommendation ?? 'Important for medication safety.'
      };
    });

    // Map lifestyles with AI recommendations
    const lifestylesItems: HealthPassLifestyleItemDto[] = lifestyles.map(l => {
      const rec = aiSuggestions.lifestyleRecommendations.find(r => r.id === l.id);
      return {
        data: l,
        isRelevant: rec?.isRelevant ?? false,
        aiRecommendation: rec?.recommendation ?? 'Share if relevant to your appointment.'
      };
    });

    // Map documents with AI recommendations
    const documentsItems: HealthPassDocumentItemDto[] = documents.map(d => {
      const rec = aiSuggestions.documentRecommendations.find(r => r.id === d.id);
      return {
        data: d,
        isRelevant: rec?.isRelevant ?? false,
        aiRecommendation: rec?.recommendation ?? 'Share if relevant to your appointment.'
      };
    });

    return {
      id: healthPass._id.toString(),
      userId: healthPass.userId.toString(),
      appointmentSpecialty: healthPass.appointmentSpecialty as AppointmentSpecialty,
      appointmentDate: healthPass.appointmentDate,
      appointmentNotes: healthPass.appointmentNotes,
      qrCode: healthPass.qrCode,
      accessCode: healthPass.accessCode,
      status: healthPass.status as HealthPassStatus,
      medicalConditions: medicalConditionsItems,
      medications: medicationsItems,
      allergies: allergiesItems,
      lifestyles: lifestylesItems,
      documents: documentsItems,
      aiRecommendations: aiSuggestions.overallRecommendation,
      aiProfileSummary: healthPass.aiProfileSummary,
      expiresAt: healthPass.expiresAt,
      lastAccessedAt: healthPass.lastAccessedAt,
      accessCount: healthPass.accessCount,
      createdAt: healthPass.createdAt,
      updatedAt: healthPass.updatedAt
    };
  }
}

export const healthPassService = new HealthPassService();

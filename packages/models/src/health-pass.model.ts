import { prop, getModelForClass, modelOptions, Severity, Ref, pre } from '@typegoose/typegoose';
import { User } from './user.model';
import { HealthPassStatus, AppointmentSpecialty, HealthPassDataToggles } from '@hakkemni/common';
import type { Types } from 'mongoose';

class SharedDataToggles implements HealthPassDataToggles {
  @prop({ default: true })
  public name!: true;

  @prop({ default: true })
  public gender!: true;

  @prop({ default: true })
  public dateOfBirth!: true;

  @prop({ default: true })
  public medicalConditions!: boolean;

  @prop({ default: true })
  public medications!: boolean;

  @prop({ default: true })
  public allergies!: boolean;

  @prop({ default: true })
  public lifestyleChoices!: boolean;

  @prop({ default: true })
  public documents!: boolean;

  @prop({ type: () => [String] })
  public specificConditions?: string[];

  @prop({ type: () => [String] })
  public specificMedications?: string[];

  @prop({ type: () => [String] })
  public specificAllergies?: string[];

  @prop({ type: () => [String] })
  public specificDocuments?: string[];
}

@pre<HealthPass>('save', function(next) {
  this.updatedAt = new Date();
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'health_passes'
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class HealthPass {
  public _id!: Types.ObjectId;

  @prop({ ref: () => User, required: true })
  public userId!: Ref<User>;

  @prop({ required: true, enum: AppointmentSpecialty })
  public appointmentSpecialty!: AppointmentSpecialty;

  @prop()
  public appointmentDate?: Date;

  @prop()
  public appointmentNotes?: string;

  @prop({ required: true, unique: true })
  public qrCode!: string;

  @prop({ required: true, unique: true })
  public accessCode!: string;

  @prop({ enum: HealthPassStatus, default: HealthPassStatus.DRAFT })
  public status!: HealthPassStatus;

  @prop({ type: () => SharedDataToggles })
  public dataToggles!: SharedDataToggles;

  @prop()
  public aiRecommendations?: string;

  @prop({ type: () => [String] })
  public aiSuggestedToggles?: string[];

  @prop({ required: true })
  public expiresAt!: Date;

  @prop()
  public lastAccessedAt?: Date;

  @prop({ default: 0 })
  public accessCount!: number;

  // Timestamps
  @prop()
  public createdAt!: Date;

  @prop()
  public updatedAt!: Date;
}

export const HealthPassModel = getModelForClass(HealthPass);


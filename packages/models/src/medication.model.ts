import { prop, getModelForClass, modelOptions, Severity, Ref, pre } from '@typegoose/typegoose';
import { User } from './user.model';
import { MedicationFrequency } from '@hakkemni/common';
import type { Types } from 'mongoose';

@pre<Medication>('save', function(next) {
  this.updatedAt = new Date();
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'medications'
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class Medication {
  public _id!: Types.ObjectId;

  @prop({ ref: () => User, required: true })
  public userId!: Ref<User>;

  @prop({ required: true })
  public medicationName!: string;

  @prop({ required: true })
  public dosageAmount!: string;

  @prop({ required: true, enum: MedicationFrequency })
  public frequency!: MedicationFrequency;

  @prop()
  public startDate?: Date;

  @prop()
  public endDate?: Date;

  @prop()
  public notes?: string;

  @prop({ default: true })
  public isActive!: boolean;

  // Timestamps
  @prop()
  public createdAt!: Date;

  @prop()
  public updatedAt!: Date;
}

export const MedicationModel = getModelForClass(Medication);


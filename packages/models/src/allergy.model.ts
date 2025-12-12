import { prop, getModelForClass, modelOptions, Severity, Ref, pre } from '@typegoose/typegoose';
import { User } from './user.model';
import type { Types } from 'mongoose';

export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening'
}

export enum AllergyType {
  DRUG = 'drug',
  FOOD = 'food',
  ENVIRONMENTAL = 'environmental',
  INSECT = 'insect',
  LATEX = 'latex',
  OTHER = 'other'
}

@pre<Allergy>('save', function(next) {
  this.updatedAt = new Date();
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'allergies'
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class Allergy {
  public _id!: Types.ObjectId;

  @prop({ ref: () => User, required: true })
  public userId!: Ref<User>;

  @prop({ required: true })
  public allergen!: string;

  @prop({ enum: AllergyType, required: true })
  public type!: AllergyType;

  @prop({ enum: AllergySeverity })
  public severity?: AllergySeverity;

  @prop()
  public reaction?: string;

  @prop()
  public diagnosedDate?: Date;

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

export const AllergyModel = getModelForClass(Allergy);


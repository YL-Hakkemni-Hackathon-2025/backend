import { prop, getModelForClass, modelOptions, Severity, Ref, pre } from '@typegoose/typegoose';
import { User } from './user.model';
import type { Types } from 'mongoose';

@pre<MedicalCondition>('save', function(next) {
  this.updatedAt = new Date();
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'medical_conditions'
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class MedicalCondition {
  public _id!: Types.ObjectId;

  @prop({ ref: () => User, required: true })
  public userId!: Ref<User>;

  @prop({ required: true })
  public name!: string;

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

export const MedicalConditionModel = getModelForClass(MedicalCondition);


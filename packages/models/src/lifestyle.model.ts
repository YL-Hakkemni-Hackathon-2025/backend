import { prop, getModelForClass, modelOptions, Severity, Ref, pre } from '@typegoose/typegoose';
import { User } from './user.model';
import { LifestyleCategory } from '@hakkemni/common';
import type { Types } from 'mongoose';

@pre<Lifestyle>('save', function(next) {
  this.updatedAt = new Date();
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'lifestyles'
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class Lifestyle {
  public _id!: Types.ObjectId;

  @prop({ ref: () => User, required: true })
  public userId!: Ref<User>;

  @prop({ required: true, enum: LifestyleCategory })
  public category!: LifestyleCategory;

  @prop({ required: true })
  public description!: string;

  @prop()
  public frequency?: string;

  @prop()
  public startDate?: Date;

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

export const LifestyleModel = getModelForClass(Lifestyle);


import { prop, getModelForClass, modelOptions, Severity, Ref, pre } from '@typegoose/typegoose';
import { User } from './user.model';
import { LifestyleCategory, HabitFrequency } from '@hakkemni/common';
import type { Types } from 'mongoose';

/**
 * Represents a single lifestyle habit (e.g., smoking, alcohol, exercise)
 */
export class LifestyleHabit {
  @prop({ required: true, enum: LifestyleCategory })
  public category!: LifestyleCategory;

  @prop({ required: true, enum: HabitFrequency, default: HabitFrequency.NOT_SET })
  public frequency!: HabitFrequency;

  @prop()
  public notes?: string;
}

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

  @prop({ ref: () => User, required: true, unique: true })
  public userId!: Ref<User>;

  @prop({ type: () => [LifestyleHabit], default: [] })
  public habits!: LifestyleHabit[];

  @prop({ default: true })
  public isActive!: boolean;

  // Timestamps
  @prop()
  public createdAt!: Date;

  @prop()
  public updatedAt!: Date;
}

export const LifestyleModel = getModelForClass(Lifestyle);

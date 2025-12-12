import { prop, getModelForClass, modelOptions, Severity, Ref, pre } from '@typegoose/typegoose';
import { Gender } from '@hakkemni/common';
import type { Types } from 'mongoose';

@pre<User>('save', function(next) {
  this.updatedAt = new Date();
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'users'
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class User {
  public _id!: Types.ObjectId;

  // Lebanese ID extracted fields
  @prop({ required: true })
  public firstName!: string;

  @prop({ required: true })
  public lastName!: string;

  @prop({ required: true, unique: true })
  public governmentId!: string;

  @prop({ required: true })
  public dateOfBirth!: Date;

  @prop({ required: true })
  public birthPlace!: string;

  @prop({ required: true })
  public dadName!: string;

  @prop({ required: true })
  public momFullName!: string;

  // Additional user fields
  @prop({ enum: Gender })
  public gender?: Gender;

  @prop()
  public phoneNumber?: string;

  @prop()
  public email?: string;

  @prop()
  public profileImageUrl?: string;

  // Authentication
  @prop()
  public lastLoginAt?: Date;

  @prop({ default: true })
  public isActive!: boolean;

  // Timestamps
  @prop()
  public createdAt!: Date;

  @prop()
  public updatedAt!: Date;

  // Virtual for full name
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const UserModel = getModelForClass(User);


import { prop, getModelForClass, modelOptions, Severity, Ref, pre } from '@typegoose/typegoose';
import { User } from './user.model';
import { DocumentType } from '@hakkemni/common';
import type { Types } from 'mongoose';

@pre<MedicalDocument>('save', function(next) {
  this.updatedAt = new Date();
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'documents'
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class MedicalDocument {
  public _id!: Types.ObjectId;

  @prop({ ref: () => User, required: true })
  public userId!: Ref<User>;

  @prop({ required: true })
  public originalFileName!: string;

  @prop({ required: true })
  public documentName!: string;

  @prop({ required: true, enum: DocumentType })
  public documentType!: DocumentType;

  @prop({ required: true })
  public fileUrl!: string;

  @prop({ required: true })
  public mimeType!: string;

  @prop()
  public fileSize?: number;

  @prop()
  public documentDate?: Date;

  @prop()
  public notes?: string;

  // AI-processed data
  @prop()
  public aiSuggestedName?: string;

  @prop()
  public aiSuggestedDate?: Date;

  @prop()
  public aiGeneratedNotes?: string;

  @prop()
  public extractedText?: string;

  @prop()
  public aiConfidence?: number;

  @prop({ default: false })
  public isAiProcessed!: boolean;

  @prop({ default: false })
  public isConfirmed!: boolean;

  @prop({ default: true })
  public isActive!: boolean;

  // Timestamps
  @prop()
  public createdAt!: Date;

  @prop()
  public updatedAt!: Date;
}

export const MedicalDocumentModel = getModelForClass(MedicalDocument);


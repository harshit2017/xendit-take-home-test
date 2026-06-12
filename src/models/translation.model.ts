// src/models/translation.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ITranslation, TranslationCategory } from '../types/i18n.types';
import { SupportedLanguage } from '../types/localization.types';

const translationSchema: Schema = new Schema(
  {
    category: {
      type: String,
      enum: Object.values(TranslationCategory),
      required: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    locale: {
      type: String,
      enum: Object.values(SupportedLanguage),
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

translationSchema.index({ category: 1, key: 1, locale: 1 }, { unique: true });
translationSchema.index({ category: 1, locale: 1 });

const Translation = mongoose.model<ITranslation & Document>('Translation', translationSchema);

export default Translation;

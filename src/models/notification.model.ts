// src/models/notification.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import {
  INotification,
  NotificationCategory,
  NotificationType,
  NotificationResourceType,
} from '../types/notification.types';

const notificationResourceSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(NotificationResourceType),
      required: true,
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

const notificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(NotificationCategory),
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    resource: {
      type: notificationResourceSchema,
      default: undefined,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, read: 1 });
notificationSchema.index({ 'resource.type': 1, 'resource.id': 1, type: 1 });

const Notification = mongoose.model<INotification & Document>('Notification', notificationSchema);

export default Notification;

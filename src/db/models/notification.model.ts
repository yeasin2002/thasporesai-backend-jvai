import {
  notificationTypeList,
  type NotificationListsType,
} from "@/common/constants";
import { Schema, model, type Document, type Types } from "mongoose";

export interface Notification {
  userId: Types.ObjectId;
  title: string;
  body: string;
  type: NotificationListsType;
  data?: Record<string, any>;
  isRead: boolean;
  isSent: boolean;
  sentAt?: Date;
  readAt?: Date;
}

export interface NotificationDocument extends Notification, Document {}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: notificationTypeList,
      default: "general",
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = model<NotificationDocument>(
  "Notification",
  notificationSchema
);

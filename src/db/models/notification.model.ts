import { Schema, Types, model, type Document } from "mongoose";

export interface Notification {
  userId: Types.ObjectId;
  title: string;
  body: string;
  type:
    | "job_posted"
    | "job_application"
    | "booking_confirmed"
    | "booking_declined"
    | "message_received"
    | "payment_received"
    | "payment_released"
    | "job_completed"
    | "review_submitted"
    | "general";
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
      enum: [
        "job_posted",
        "job_application",
        "booking_confirmed",
        "booking_declined",
        "message_received",
        "payment_received",
        "payment_released",
        "job_completed",
        "review_submitted",
        "general",
      ],
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

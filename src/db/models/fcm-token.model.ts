import { Schema, model, type Document, type Types } from "mongoose";

export interface FcmToken {
  userId: Types.ObjectId;
  token: string;
  deviceId: string;
  deviceType: "android" | "ios";
  isActive: boolean;
  lastUsed: Date;
}

export interface FcmTokenDocument extends FcmToken, Document {}

const fcmTokenSchema = new Schema<FcmTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ["android", "ios"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
fcmTokenSchema.index({ userId: 1, deviceId: 1 });

export const FcmToken = model<FcmTokenDocument>("FcmToken", fcmTokenSchema);

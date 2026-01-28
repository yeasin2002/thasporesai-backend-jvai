import { Schema, model, type Document, type Types } from "mongoose";

export interface CompletionRequest {
  job: Types.ObjectId;
  offer: Types.ObjectId;
  customer: Types.ObjectId;
  contractor: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
  rejectionReason?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export interface CompletionRequestDocument
  extends CompletionRequest, Document {}

const completionRequestSchema = new Schema<CompletionRequestDocument>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      unique: true,
    },
    offer: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contractor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
completionRequestSchema.index({ job: 1 }, { unique: true }); // One completion request per job
completionRequestSchema.index({ status: 1, createdAt: -1 }); // For admin dashboard queries

export const CompletionRequest = model<CompletionRequestDocument>(
  "CompletionRequest",
  completionRequestSchema
);

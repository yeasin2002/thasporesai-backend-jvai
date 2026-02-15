import { Schema, model, type Document, type Types } from "mongoose";

export interface WithdrawalRequest {
  contractor: Types.ObjectId;
  amount: number;
  status: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
  rejectionReason?: string;
  stripeTransferId?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export interface WithdrawalRequestDocument
  extends WithdrawalRequest, Document {}

const withdrawalRequestSchema = new Schema<WithdrawalRequestDocument>(
  {
    contractor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
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
    stripeTransferId: {
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
withdrawalRequestSchema.index({ contractor: 1, status: 1, createdAt: -1 }); // For contractor's withdrawal history
withdrawalRequestSchema.index({ status: 1, createdAt: -1 }); // For admin dashboard queries

export const WithdrawalRequest = model<WithdrawalRequestDocument>(
  "WithdrawalRequest",
  withdrawalRequestSchema
);

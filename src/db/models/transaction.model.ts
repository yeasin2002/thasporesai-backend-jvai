import { Schema, model, type Document, type Types } from "mongoose";

export interface Transaction {
  type:
    | "platform_fee"
    | "service_fee"
    | "contractor_payout"
    | "refund"
    | "deposit"
    | "withdrawal"
    | "escrow_hold"
    | "escrow_release";
  amount: number;
  from: Types.ObjectId;
  to: Types.ObjectId;
  offer?: Types.ObjectId;
  job?: Types.ObjectId;
  status: "pending" | "completed" | "failed";
  description: string;
  failureReason?: string;
  completedAt?: Date;
}

export interface TransactionDocument extends Transaction, Document {}

const transactionSchema = new Schema<TransactionDocument>(
  {
    type: {
      type: String,
      enum: [
        "platform_fee",
        "service_fee",
        "contractor_payout",
        "refund",
        "deposit",
        "withdrawal",
        "escrow_hold",
        "escrow_release",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offer: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    description: {
      type: String,
      required: true,
    },
    failureReason: String,
    completedAt: Date,
  },
  { timestamps: true }
);

// Indexes
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });

export const Transaction = model<TransactionDocument>(
  "Transaction",
  transactionSchema
);

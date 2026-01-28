import { Schema, model, type Document, type Types } from "mongoose";

export interface Transaction {
  type:
    | "deposit"
    | "withdrawal"
    | "wallet_transfer"
    | "contractor_payout"
    | "refund";
  amount: number;
  from: Types.ObjectId | null;
  to: Types.ObjectId | null;
  offer?: Types.ObjectId;
  job?: Types.ObjectId;
  status: "pending" | "completed" | "failed";
  description: string;
  failureReason?: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  stripeCheckoutSessionId?: string;
  completedAt?: Date;
}

export interface TransactionDocument extends Transaction, Document {}

const transactionSchema = new Schema<TransactionDocument>(
  {
    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "wallet_transfer",
        "contractor_payout",
        "refund",
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
      default: null,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    stripeTransferId: {
      type: String,
      sparse: true,
    },
    stripeCheckoutSessionId: {
      type: String,
      sparse: true,
      unique: true,
    },
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

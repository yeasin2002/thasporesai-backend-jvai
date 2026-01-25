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

  // Stripe integration fields
  stripePaymentIntentId?: string; // For deposits via Stripe Payment Intents
  stripeTransferId?: string; // For transfers between Stripe accounts
  stripePayoutId?: string; // For withdrawals/payouts to bank accounts
  stripeStatus?: string; // Stripe-specific status (succeeded, processing, failed, etc.)
  stripeError?: string; // Detailed error from Stripe if transaction failed

  // Idempotency and retry fields
  idempotencyKey?: string; // Unique key to prevent duplicate transactions
  retryCount?: number; // Number of retry attempts for failed transactions
  lastRetryAt?: Date; // Timestamp of last retry attempt
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

    // Stripe integration fields
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    stripeTransferId: {
      type: String,
      sparse: true,
    },
    stripePayoutId: {
      type: String,
      sparse: true,
    },
    stripeStatus: {
      type: String,
    },
    stripeError: {
      type: String,
    },

    // Idempotency and retry fields
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });

// Stripe-specific indexes
transactionSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });
transactionSchema.index({ stripeTransferId: 1 }, { sparse: true });
transactionSchema.index({ stripePayoutId: 1 }, { sparse: true });

// Idempotency index
transactionSchema.index({ idempotencyKey: 1 }, { sparse: true, unique: true });

export const Transaction = model<TransactionDocument>(
  "Transaction",
  transactionSchema
);

import { Schema, Types, model, type Document } from "mongoose";

export interface Wallet {
  user: Types.ObjectId;
  balance: number;
  escrowBalance: number;
  currency: string;
  isActive: boolean;
  isFrozen: boolean;
  totalEarnings: number;
  totalSpent: number;
  totalWithdrawals: number;
  pendingDeposits?: number; // Deposits awaiting Stripe confirmation
  lastStripeSync?: Date; // Last time wallet was synced with Stripe
}

export interface WalletDocument extends Wallet, Document {}

const walletSchema = new Schema<WalletDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    escrowBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingDeposits: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastStripeSync: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Wallet = model<WalletDocument>("Wallet", walletSchema);

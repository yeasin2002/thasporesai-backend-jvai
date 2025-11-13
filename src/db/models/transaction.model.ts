import { Schema, Types, model, type Document } from "mongoose";

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
			index: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		from: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		to: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		offer: {
			type: Schema.Types.ObjectId,
			ref: "Offer",
			index: true,
		},
		job: {
			type: Schema.Types.ObjectId,
			ref: "Job",
			index: true,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed"],
			default: "pending",
			index: true,
		},
		description: {
			type: String,
			required: true,
		},
		failureReason: String,
		completedAt: Date,
	},
	{ timestamps: true },
);

// Indexes
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });

export const Transaction = model<TransactionDocument>(
	"Transaction",
	transactionSchema,
);

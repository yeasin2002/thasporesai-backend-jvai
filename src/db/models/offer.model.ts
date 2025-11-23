import type { Document, Types } from "mongoose";
import { Schema, model } from "mongoose";

export interface Offer {
	job: Types.ObjectId;
	customer: Types.ObjectId;
	contractor: Types.ObjectId;
	application?: Types.ObjectId; // Optional: for offers from job applications
	invite?: Types.ObjectId; // Optional: for offers from job invites

	// Amounts
	amount: number;
	platformFee: number;
	serviceFee: number;
	contractorPayout: number;
	totalCharge: number;

	// Details
	timeline: string;
	description: string;

	// Status
	status:
		| "pending"
		| "accepted"
		| "rejected"
		| "cancelled"
		| "completed"
		| "expired";

	// Timestamps
	acceptedAt?: Date;
	rejectedAt?: Date;
	cancelledAt?: Date;
	completedAt?: Date;
	expiresAt?: Date;

	// Reasons
	rejectionReason?: string;
	cancellationReason?: string;
}

export interface OfferDocument extends Offer, Document {}

const offerSchema = new Schema<OfferDocument>(
	{
		job: {
			type: Schema.Types.ObjectId,
			ref: "Job",
			required: true,
			index: true,
		},
		customer: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		contractor: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		application: {
			type: Schema.Types.ObjectId,
			ref: "JobApplicationRequest",
			required: false, // Optional: for offers from job applications
			index: true,
		},
		invite: {
			type: Schema.Types.ObjectId,
			ref: "JobInvite",
			required: false, // Optional: for offers from job invites
			index: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		platformFee: {
			type: Number,
			required: true,
			min: 0,
		},
		serviceFee: {
			type: Number,
			required: true,
			min: 0,
		},
		contractorPayout: {
			type: Number,
			required: true,
			min: 0,
		},
		totalCharge: {
			type: Number,
			required: true,
			min: 0,
		},
		timeline: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: false,
		},
		status: {
			type: String,
			enum: [
				"pending",
				"accepted",
				"rejected",
				"cancelled",
				"completed",
				"expired",
			],
			default: "pending",
			index: true,
		},
		acceptedAt: Date,
		rejectedAt: Date,
		cancelledAt: Date,
		completedAt: Date,
		expiresAt: Date,
		rejectionReason: String,
		cancellationReason: String,
	},
	{ timestamps: true },
);

// Indexes
offerSchema.index({ job: 1 }, { unique: true }); // One offer per job
offerSchema.index({ contractor: 1, status: 1 });
offerSchema.index({ customer: 1, status: 1 });

export const Offer = model<OfferDocument>("Offer", offerSchema);

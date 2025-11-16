import type { Document, Types } from "mongoose";
import { Schema, model } from "mongoose";

export interface JobInvite {
	job: Types.ObjectId;
	customer: Types.ObjectId; // Customer who sent the invite
	contractor: Types.ObjectId; // Contractor who received the invite
	status: "pending" | "accepted" | "rejected" | "cancelled";
	message?: string;
	rejectionReason?: string;
}

export interface JobInviteDocument extends JobInvite, Document {}

export const JobInviteSchema = new Schema<JobInviteDocument>(
	{
		job: {
			type: Schema.Types.ObjectId,
			ref: "Job",
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
			enum: ["pending", "accepted", "rejected", "cancelled"],
			default: "pending",
		},
		message: {
			type: String,
			trim: true,
		},
		rejectionReason: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true },
);

// Compound index to prevent duplicate invites
JobInviteSchema.index({ job: 1, contractor: 1 }, { unique: true });

// Index for querying by customer
JobInviteSchema.index({ customer: 1, status: 1 });

// Index for querying by contractor
JobInviteSchema.index({ contractor: 1, status: 1 });

export const JobInvite = model<JobInviteDocument>("JobInvite", JobInviteSchema);

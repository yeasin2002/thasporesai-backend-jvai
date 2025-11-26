import type { Document, Types } from "mongoose";
import { Schema, model } from "mongoose";

export interface JobApplicationRequest {
	job: Types.ObjectId;
	contractor: Types.ObjectId;
	status: "pending" | "accepted" | "rejected" | "offer_sent";
	message?: string;
	offerId?: Types.ObjectId; // Reference to offer if sent
}

export interface JobApplicationRequestDocument
	extends JobApplicationRequest,
		Document {}

export const JobApplicationRequestSchema =
	new Schema<JobApplicationRequestDocument>(
		{
			job: {
				type: Schema.Types.ObjectId,
				ref: "Job",
				required: true,
			},
			contractor: {
				type: Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
			status: {
				type: String,
				enum: ["pending", "accepted", "rejected", "offer_sent"],
				default: "pending",
			},
			message: {
				type: String,
				trim: true,
			},
			offerId: {
				type: Schema.Types.ObjectId,
				ref: "Offer",
			},
		},
		{ timestamps: true },
	);

// Compound index to prevent duplicate applications
JobApplicationRequestSchema.index({ job: 1, contractor: 1 }, { unique: true });

export const JobApplicationRequest = model<JobApplicationRequestDocument>(
	"JobApplicationRequest",
	JobApplicationRequestSchema,
);

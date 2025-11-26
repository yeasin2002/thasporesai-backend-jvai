import type { Document, Types } from "mongoose";
import { Schema, model } from "mongoose";
type Status = "invited" | "requested" | "engaged" | "offered" | "cancelled";
const statusListForInviteAndApplication: Status[] = [
	"invited",
	"requested",
	"engaged",
	"offered",
	"cancelled",
];

export interface Application {
	job: Types.ObjectId;
	customer: Types.ObjectId; // Customer who sent the invite
	contractor: Types.ObjectId; // Contractor who received the invite
	status: Status;
	sender: string;
	offerId: Types.ObjectId;
}

export interface JobInviteDocument extends Application, Document {}

const JobInviteApplicationSchema = new Schema<JobInviteDocument>(
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
			enum: statusListForInviteAndApplication,
			default: "invited",
		},
		sender: { type: String },
		offerId: { type: Schema.Types.ObjectId },
	},

	{ timestamps: true },
);

// Compound index to prevent duplicate invites
JobInviteApplicationSchema.index({ job: 1, contractor: 1 }, { unique: true });

// Index for querying by customer
JobInviteApplicationSchema.index({ customer: 1, status: 1 });

// Index for querying by contractor
JobInviteApplicationSchema.index({ contractor: 1, status: 1 });

export const JobInviteApplication = model<JobInviteDocument>(
	"invite-application",
	JobInviteApplicationSchema,
);

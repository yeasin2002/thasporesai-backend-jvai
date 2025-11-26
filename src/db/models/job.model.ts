import { Schema, model, type Document, type Types } from "mongoose";

export interface Job {
	title: string;
	category: Types.ObjectId[]; // Array of category IDs
	jobApplicationRequest: Types.ObjectId[]; // Array of category IDs
	description: string;
	location: Types.ObjectId;
	address: string;
	budget: number;
	date: Date;
	coverImg: string;
	customerId: Types.ObjectId; // User who posted the job

	// Payment system fields
	contractorId?: Types.ObjectId; // Assigned contractor
	offerId?: Types.ObjectId; // Accepted offer
	status: "open" | "in_progress" | "assigned" | "completed" | "cancelled";
	assignedAt?: Date;
	completedAt?: Date;
	cancelledAt?: Date;
	cancellationReason?: string;
}

export interface JobDocument extends Job, Document {}

export const JobSchema = new Schema<JobDocument>(
	{
		title: {
			type: String,
			required: true,
		},

		description: {
			type: String,
			required: true,
		},
		location: {
			type: Schema.Types.ObjectId,
			ref: "location",
			required: true,
		},
		address: {
			type: String,
			required: true,
		},
		budget: {
			type: Number,
			required: true,
		},
		date: {
			type: Date,
			default: Date.now,
		},
		coverImg: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ["open", "assigned", "in_progress", "completed", "cancelled"],
			default: "open",
		},

		//
		category: [
			{
				type: Schema.Types.ObjectId,
				ref: "Category",
				required: true,
			},
		],
		jobApplicationRequest: [
			{
				type: Schema.Types.ObjectId,
				ref: "JobApplicationRequest",
			},
		],
		customerId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		// Payment system fields
		contractorId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			index: true,
		},
		offerId: {
			type: Schema.Types.ObjectId,
			ref: "Offer",
		},
		assignedAt: Date,
		completedAt: Date,
		cancelledAt: Date,
		cancellationReason: String,
	},
	{ timestamps: true },
);

export const Job = model<JobDocument>("Job", JobSchema);

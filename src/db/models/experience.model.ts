import { Schema, Types, model, type Document } from "mongoose";

export interface Experience {
	user: Types.ObjectId; // Reference to the user who owns this experience
	company_name: string;
	title: string;
	description: string;
	start_date: Date;
	end_date?: Date;
}

export interface ExperienceDocument extends Experience, Document {}

const experienceSchema = new Schema<ExperienceDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    company_name: { type: String, required: true },
    start_date: { type: Date },
    end_date: { type: Date },
  },
  { timestamps: true }
);

// Index for querying user's experiences
experienceSchema.index({ user: 1, createdAt: -1 });

export const Experience = model<ExperienceDocument>(
	"Experience",
	experienceSchema,
);

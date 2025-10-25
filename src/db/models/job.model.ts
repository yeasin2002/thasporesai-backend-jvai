import { Schema, model, type Document, type Types } from "mongoose";

export interface Job {
  title: string;
  category: Types.ObjectId[]; // Array of category IDs
  jobApplicationRequest: Types.ObjectId[]; // Array of category IDs
  description: string;
  location: string;
  budget: number;
  date: Date;
  coverImg: string;
  customerId: Types.ObjectId; // User who posted the job
  // AssignedContractorId?: Types.ObjectId; // Assigned contractor (optional)
  status: "open" | "in_progress" | "completed" | "cancelled";
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
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    coverImg: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "cancelled"],
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
    // contractorId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    // },
  },
  { timestamps: true }
);

export const Job = model<JobDocument>("Job", JobSchema);

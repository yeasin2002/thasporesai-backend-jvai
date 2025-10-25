import { Document, Schema, Types, model } from "mongoose";

export interface JobApplicationRequest {
  job: Types.ObjectId;
  customer: Types.ObjectId;
}

export interface JobApplicationRequestDocument
  extends JobApplicationRequest,
    Document {}

export const JobApplicationRequestSchema = new Schema<JobApplicationRequestDocument>(
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
  },
  { timestamps: true }
);

export const JobApplicationRequest = model<JobApplicationRequestDocument>(
  "JobApplicationRequest",
  JobApplicationRequestSchema
);

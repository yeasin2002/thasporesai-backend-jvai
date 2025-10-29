import { Schema, model, type Document } from "mongoose";

export interface WorkSample {
  name: string;
  img: string;
  description?: string;
}

export interface WorkSampleDocument extends WorkSample, Document {}

const workSampleSchema = new Schema<WorkSampleDocument>(
  {
    name: { type: String, required: true },
    img: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const WorkSample = model<WorkSampleDocument>(
  "WorkSample",
  workSampleSchema
);

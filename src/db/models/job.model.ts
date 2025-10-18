import { type Document, model, Schema } from "mongoose";
import { Category } from "./category.model";

export interface Job {
  title: string;
  category: Category[];
  description: string;
  location: string;
  budget: string;
  date: string;
  coverImg: string;
}

export interface JobDocument extends Job, Document {}

export const JobSchema = new Schema<JobDocument>({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: [Category],
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
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  coverImg: {
    type: String,
    required: true,
  },
});

export const Job = model<JobDocument>("Job", JobSchema);

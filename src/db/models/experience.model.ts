import { Schema, model, type Document } from "mongoose";

export interface Experience {
  company_name: string;
  title: string;
  subtitle: string;
  start_date: Date;
  end_date?: Date;
}

export interface ExperienceDocument extends Experience, Document {}

const experienceSchema = new Schema<ExperienceDocument>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    company_name: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date },
  },
  { timestamps: true }
);

export const Experience = model<ExperienceDocument>(
  "Experience",
  experienceSchema
);

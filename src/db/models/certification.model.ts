import { Schema, model, type Document } from "mongoose";

export interface Certification {
  title: string;
  img: string;
  description?: string;
}

export interface CertificationDocument extends Certification, Document {}

const certificationSchema = new Schema<CertificationDocument>(
  {
    title: { type: String, required: true },
    img: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Certification = model<CertificationDocument>(
  "Certification",
  certificationSchema
);

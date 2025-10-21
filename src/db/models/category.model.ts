import { Schema, model, type Document } from "mongoose";

export interface Category {
  name: string;
  icon: string;
  description: string;
}

export interface CategoryDocument extends Category, Document {}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    icon: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Category = model<CategoryDocument>("Category", CategorySchema);

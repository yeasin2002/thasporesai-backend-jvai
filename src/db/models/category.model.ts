import { Schema, model, type Document } from "mongoose";

export interface Category {
	message: string;
	star: number;
	description: string;
	icon: string;
}

export interface CategoryDocument extends Category, Document {}

const CategorySchema = new Schema<CategoryDocument>(
	{
		message: {
			type: String,
			required: true,
		},
		star: {
			type: Number,
			required: true,
			min: 0,
			max: 5,
		},
		description: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true },
);

export const Category = model<CategoryDocument>("Category", CategorySchema);

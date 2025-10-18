import { type Document, model, Schema } from "mongoose";

export interface Category {
  name: string;
  icon: string;
  description: string;
}



 const CategorySchema = new Schema<CategoryDocument>({
   name: {
     type: String,
     required: true,
   },
   icon: {
     type: String,
     required: true,
   },
   description: {
     type: String,
     required: true,
   },
 });

 export const Category = model<CategoryDocument>("Category", CategorySchema);
 export interface CategoryDocument extends Category, Document {}
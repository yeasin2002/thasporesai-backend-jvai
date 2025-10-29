import { Schema, Types, model, type Document } from "mongoose";

export interface User {
  role: "contractor" | "customer" | "admin";
  full_name: string;
  profile_img: string;
  cover_img: string;
  email: string;
  password: string;
  phone?: string;
  bio: string;
  description: string;
  location?: Types.ObjectId[];
  availability?: Date;
  is_verified: boolean;
  isSuspend: boolean;
  category: Types.ObjectId[];
  review: Types.ObjectId[];

  // Contractor specific fields
  skills: string[];
  experience: Array<{
    company_name: string;
    start_date: Date;
    end_date?: Date;
  }>;
  work_samples: Array<{
    name: string;
    img: string;
    description?: string;
  }>;
  starting_budget: number;
  certification: {
    title: string;
    img: string;
  };
  hourly_charge: number;
  // Auth related
  refreshTokens?: Array<{
    token: string;
    jti: string;
    createdAt: Date;
  }>;
  otp?: {
    code: string;
    expiresAt: Date;
    used: boolean;
  };
}

export interface UserDocument extends User, Document {}

const userSchema = new Schema<UserDocument>(
  {
    role: {
      type: String,
      enum: ["contractor", "customer", "admin"],
      default: "customer",
    },
    full_name: { type: String, required: true },
    profile_img: { type: String, default: "" },
    cover_img: { type: String, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String },
    bio: { type: String, default: "" },
    description: { type: String, default: "" },
    availability: { type: Date },
    is_verified: { type: Boolean, default: false },
    isSuspend: { type: Boolean, default: false },

    location: [{ type: Types.ObjectId, ref: "location" }],
    category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    review: [{ type: Schema.Types.ObjectId, ref: "Review" }],

    // Contractor specific fields
    skills: [{ type: String }],
    experience: [
      {
        company_name: { type: String },
        start_date: { type: Date },
        end_date: { type: Date },
      },
    ],
    work_samples: [
      {
        name: { type: String },
        img: { type: String },
        description: { type: String },
      },
    ],
    starting_budget: { type: Number, default: 0 },
    certification: {
      title: { type: String },
      img: { type: String },
    },
    hourly_charge: { type: Number, default: 0 },
    // Auth related
    refreshTokens: [
      {
        token: { type: String, required: true },
        jti: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
      used: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const User = model<UserDocument>("User", userSchema);

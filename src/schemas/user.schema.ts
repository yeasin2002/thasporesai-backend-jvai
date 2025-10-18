import { type Document, Schema } from "mongoose";

// Define the User interface for TypeScript typing
export interface User {
	role: string;
	category: string[];
	starting_budget: number;
	availability: Date;
	location: string;
	full_name: string;
	profile_avatar: string;
	email: string;
	bio: string;
	top_skills: string[];
	experience: string[];
	certification: string;
	work_samples: string[];
	createdAt: Date;
}

// Extend Document to get Mongoose document methods
export interface UserDocument extends User, Document {}

// Create the traditional Mongoose schema
export const UserSchema = new Schema<UserDocument>(
	{
		role: {
			type: String,
			enum: ["contractor", "user", "admin"],
			required: true,
			default: "user",
		},
		category: {
			type: [String],
			default: [],
		},
		starting_budget: {
			type: Number,
			default: 0,
		},
		availability: {
			type: Date,
		},
		location: {
			type: String,
			trim: true,
		},
		full_name: {
			type: String,
			required: true,
			trim: true,
		},
		profile_avatar: {
			type: String,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		bio: {
			type: String,
			maxlength: 1000,
		},
		top_skills: {
			type: [String],
			default: [],
		},
		experience: {
			type: [String],
			default: [],
		},
		certification: {
			type: String,
		},
		work_samples: {
			type: [String], // store URLs or file paths
			default: [],
		},
	},
	{
		timestamps: true, // Adds createdAt and updatedAt automatically
		collection: "users",
	},
);

// Add instance methods (optional)
// UserSchema.methods.getFullInfo = function () {
//   return `${this.name} (${this.email}) - Age: ${this.age}`;
// };

// Add static methods (optional)
UserSchema.statics.findByEmail = function (email: string) {
	return this.findOne({ email });
};

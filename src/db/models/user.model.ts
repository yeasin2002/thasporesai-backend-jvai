import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true, lowercase: true },
		password: { type: String, required: true },
		role: {
			type: String,
			enum: ["customer", "contractor", "admin"],
			default: "customer",
		},
		phone: { type: String },
		isActive: { type: Boolean, default: true },
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
	{ timestamps: true },
);

export const User = mongoose.model("User", userSchema);

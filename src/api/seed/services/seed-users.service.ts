import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers/response-handler";
import { hashPassword } from "@/lib/jwt";
import type { RequestHandler } from "express";

const seedUserData = [
	{
		full_name: "Customer User",
		email: "customer@g.com",
		password: "123456",
		role: "customer",
		phone: "+1234567890",
	},
	{
		full_name: "Contractor User",
		email: "contractor@g.com",
		password: "123456",
		role: "contractor",
		phone: "+0987654321",
	},
	{
		full_name: "Admin User",
		email: "admin@g.com",
		password: "123456",
		role: "admin",
		phone: "+1122334455",
	},
];

export const seedUsers: RequestHandler = async (_req, res) => {
	try {
		// Check if users already exist
		const existingCount = await db.user.countDocuments();
		if (existingCount > 0) {
			return sendError(
				res,
				400,
				`Database already contains ${existingCount} users. Clear the collection first if you want to reseed.`,
			);
		}

		// Hash passwords and prepare user data
		const usersToInsert = await Promise.all(
			seedUserData.map(async (user) => ({
				...user,
				password: await hashPassword(user.password),
				isActive: true,
			})),
		);

		// Insert all users
		const users = await db.user.insertMany(usersToInsert);

		// Remove passwords from response
		const sanitizedUsers = users.map((user) => {
			const userObj = user.toObject();
			delete userObj.password;
			return userObj;
		});

		return sendSuccess(
			res,
			201,
			`Successfully seeded ${users.length} users`,
			sanitizedUsers,
		);
	} catch (error) {
		console.log(error);
		return sendError(res, 500, "Internal Server Error");
	}
};

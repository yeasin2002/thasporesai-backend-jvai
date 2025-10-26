import type { SuspendUser } from "@/api/admin/user/user.validation";
import { db } from "@/db";
import type { RequestHandler } from "express";

// Get all users with search and filter
export const getAllUsers: RequestHandler = async (req, res) => {
	try {
		const { search, role } = req.query as { search?: string; role?: string };

		// Build query filter
		const filter: any = {};

		// Search by full name (case-insensitive)
		if (search) {
			filter.full_name = { $regex: search, $options: "i" };
		}

		// Filter by role
		if (role) {
			filter.role = role;
		}

		// Fetch users with populated category data
		const users = await db.user
			.find(filter)
			.select("-password -refreshTokens -otp")
			.populate("category", "message icon description")
			.sort({ createdAt: -1 });

		res.status(200).json({
			status: 200,
			message: "Users fetched successfully",
			data: users,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

// Get single user by ID
export const getUserById: RequestHandler<{ id: string }> = async (req, res) => {
	try {
		const { id } = req.params;

		const user = await db.user
			.findById(id)
			.select("-password -refreshTokens -otp")
			.populate("category", "message icon description");

		if (!user) {
			return res.status(404).json({
				status: 404,
				message: "User not found",
				data: null,
			});
		}

		res.status(200).json({
			status: 200,
			message: "User fetched successfully",
			data: user,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

// Delete user account (hard delete)
export const deleteUser: RequestHandler<{ id: string }> = async (req, res) => {
	try {
		const { id } = req.params;

		const user = await db.user.findByIdAndDelete(id);

		if (!user) {
			return res.status(404).json({
				status: 404,
				message: "User not found",
				data: null,
			});
		}

		res.status(200).json({
			status: 200,
			message: "User account deleted successfully",
			data: null,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

// Suspend or unsuspend user
export const suspendUser: RequestHandler<
	{ id: string },
	any,
	SuspendUser
> = async (req, res) => {
	try {
		const { id } = req.params;
		const { suspend, reason } = req.body;

		const user = await db.user.findById(id);

		if (!user) {
			return res.status(404).json({
				status: 404,
				message: "User not found",
				data: null,
			});
		}

		// Update user suspension status
		// Note: You may want to add a 'suspended' field to your user model
		// For now, we'll use a workaround with the existing fields
		const updateData: any = {};

		if (suspend) {
			// Mark as suspended (you might want to add a 'suspended' boolean field to the model)
			updateData.is_verified = false;
			console.log(
				`User ${user.full_name} suspended. Reason: ${
					reason || "No reason provided"
				}`,
			);
		} else {
			// Unsuspend user
			updateData.is_verified = true;
			console.log(`User ${user.full_name} unsuspended`);
		}

		await db.user.findByIdAndUpdate(id, updateData);

		res.status(200).json({
			status: 200,
			message: suspend
				? "User suspended successfully"
				: "User unsuspended successfully",
			data: null,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

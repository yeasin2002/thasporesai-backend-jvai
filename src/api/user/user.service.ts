import type { CreateUser, UpdateUser } from "@/api/user/user.schema";
import { db } from "@/db";
import type { RequestHandler } from "express";

export const getallUser: RequestHandler = async (req, res) => {
	try {
		const users = await db.user.find().select("-password");
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

export const createUser: RequestHandler<{}, any, CreateUser> = async (
	req,
	res,
) => {
	try {
		// Check if user already exists
		const existingUser = await db.user.findOne({ email: req.body.email });
		if (existingUser) {
			return res.status(400).json({
				status: 400,
				message: "User with this email already exists",
				data: null,
			});
		}

		const user = await db.user.create(req.body);
		const userResponse = user.toObject();
		const { password: _password, ...userWithoutPassword } = userResponse;

		res.status(201).json({
			status: 201,
			message: "User created successfully",
			data: userWithoutPassword,
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

export const updateUser: RequestHandler<
	{ id: string },
	any,
	UpdateUser
> = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if user exists
		const existingUser = await db.user.findById(id);
		if (!existingUser) {
			return res.status(404).json({
				status: 404,
				message: "User not found",
				data: null,
			});
		}

		// Check if email is being updated and if it already exists
		if (req.body.email && req.body.email !== existingUser.email) {
			const emailExists = await db.user.findOne({ email: req.body.email });
			if (emailExists) {
				return res.status(400).json({
					status: 400,
					message: "User with this email already exists",
					data: null,
				});
			}
		}

		const user = await db.user
			.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
			.select("-password");

		res.status(200).json({
			status: 200,
			message: "User updated successfully",
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

export const deleteUser: RequestHandler<{ id: string }> = async (req, res) => {
	try {
		const { id } = req.params;

		const user = await db.user.findByIdAndDelete(id).select("-password");

		if (!user) {
			return res.status(404).json({
				status: 404,
				message: "User not found",
				data: null,
			});
		}

		res.status(200).json({
			status: 200,
			message: "User deleted successfully",
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

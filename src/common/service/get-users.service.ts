import { db } from "@/db";
import type { UserDocument } from "@/db/models/user.model";
import type { FilterQuery } from "mongoose";

export interface GetUsersOptions {
	search?: string;
	role?: "contractor" | "customer" | "admin";
	location?: string;
	category?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface PaginatedUsersResult {
	users: UserDocument[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalUsers: number;
		limit: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

/**
 * Common service to fetch users with search, filters, and pagination
 * Can be reused across admin and user modules
 */
export const getUsersService = async (
	options: GetUsersOptions,
): Promise<PaginatedUsersResult> => {
	const {
		search,
		role,
		location,
		category,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = options;

	// Build query filter with proper typing
	const filter: FilterQuery<UserDocument> = {};

	// Search by full name or email (case-insensitive)
	if (search) {
		filter.$or = [
			{ full_name: { $regex: search, $options: "i" } },
			{ email: { $regex: search, $options: "i" } },
		];
	}

	// Filter by role
	if (role) {
		filter.role = role;
	}

	// Filter by location (user's location array contains the specified location ID)
	if (location) {
		filter.location = location;
	}

	// Filter by category (user's category array contains the specified category ID)
	if (category) {
		filter.category = category;
	}

	// Calculate pagination
	const skip = (page - 1) * limit;
	const sortDirection = sortOrder === "asc" ? 1 : -1;

	// Fetch total count for pagination
	const totalUsers = await db.user.countDocuments(filter);

	// Fetch users with populated category and location data
	const users = await db.user
		.find(filter)
		.select("-password -refreshTokens -otp")
		.populate("category", "name icon description")
		.populate("location", "name state coordinates")
		.sort({ [sortBy]: sortDirection })
		.skip(skip)
		.limit(limit)
		.lean<UserDocument[]>();

	// Calculate pagination metadata
	const totalPages = Math.ceil(totalUsers / limit);
	const hasNextPage = page < totalPages;
	const hasPrevPage = page > 1;

	return {
		users,
		pagination: {
			currentPage: page,
			totalPages,
			totalUsers,
			limit,
			hasNextPage,
			hasPrevPage,
		},
	};
};

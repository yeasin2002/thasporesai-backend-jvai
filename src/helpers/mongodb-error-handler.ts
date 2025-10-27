import { logger } from "@/lib";
import type { Response } from "express";
import type { Error as MongooseError } from "mongoose";
import { sendBadRequest, sendInternalError } from "./response-handler";

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param id - String to validate
 * @returns boolean indicating if the string is a valid ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
	return /^[a-f\d]{24}$/i.test(id);
};

/**
 * Handle MongoDB errors and send appropriate response
 * @param error - Error object from MongoDB/Mongoose
 * @param res - Express response object
 * @param defaultMessage - Default error message if error type is unknown
 * @returns Response object
 */
export const exceptionErrorHandler = (
	error: unknown,
	res: Response,
	defaultMessage = "Database operation failed",
) => {
	console.error("MongoDB Error:", error);
	logger.error("MongoDB Error:", error);

	if (error && typeof error === "object" && "name" in error) {
		const mongoError = error as MongooseError;

		// Handle CastError (invalid ObjectId format)
		if (mongoError.name === "CastError") {
			return sendBadRequest(
				res,
				"Invalid ID format provided. Please check your input",
			);
		}

		// Handle ValidationError
		if (mongoError.name === "ValidationError") {
			const validationError = mongoError as any;
			const errors = Object.values(validationError.errors || {}).map(
				(err: any) => ({
					path: err.path || "unknown",
					message: err.message || "Validation failed",
				}),
			);

			return sendBadRequest(res, "Validation failed", errors);
		}

		// Handle Duplicate Key Error (E11000)
		if ("code" in mongoError && (mongoError as any).code === 11000) {
			const duplicateError = mongoError as any;
			const field = Object.keys(duplicateError.keyPattern || {})[0] || "field";
			return sendBadRequest(
				res,
				`Duplicate value for ${field}. This ${field} already exists`,
			);
		}
	}

	// Default internal server error
	return sendInternalError(res, defaultMessage);
};

/**
 * Validate multiple ObjectIds
 * @param ids - Array of IDs to validate
 * @returns Object with isValid boolean and invalid IDs array
 */
export const validateObjectIds = (
	ids: string[],
): { isValid: boolean; invalidIds: string[] } => {
	const invalidIds = ids.filter((id) => !isValidObjectId(id));
	return {
		isValid: invalidIds.length === 0,
		invalidIds,
	};
};

/**
 * Validate and sanitize pagination parameters
 * @param page - Page number string
 * @param limit - Limit number string
 * @param maxLimit - Maximum allowed limit (default: 100)
 * @returns Object with validated page, limit, and skip values
 */
export const validatePagination = (
	page = "1",
	limit = "10",
	maxLimit = 100,
): { page: number; limit: number; skip: number } => {
	let pageNum = Number.parseInt(page, 10);
	let limitNum = Number.parseInt(limit, 10);

	// Validate and sanitize
	pageNum = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
	limitNum = Number.isNaN(limitNum) || limitNum < 1 ? 10 : limitNum;
	limitNum = limitNum > maxLimit ? maxLimit : limitNum;

	const skip = (pageNum - 1) * limitNum;

	return { page: pageNum, limit: limitNum, skip };
};

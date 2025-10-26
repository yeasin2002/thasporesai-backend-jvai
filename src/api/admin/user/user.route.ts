import "./user.openapi";

import {
	validateBody,
	validateParams,
	validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";

import {
	deleteUser,
	getAllUsers,
	getUserById,
	suspendUser,
} from "./user.service";
import {
	SuspendUserSchema,
	UserIdParamSchema,
	UserQuerySchema,
} from "./user.validation";

export const adminUser: Router = express.Router();

// User management routes
adminUser
	.get("/", validateQuery(UserQuerySchema), getAllUsers)
	.get("/:id", validateParams(UserIdParamSchema), getUserById)
	.delete("/:id", validateParams(UserIdParamSchema), deleteUser)
	.patch(
		"/:id/suspend",
		validateParams(UserIdParamSchema),
		validateBody(SuspendUserSchema),
		suspendUser,
	);

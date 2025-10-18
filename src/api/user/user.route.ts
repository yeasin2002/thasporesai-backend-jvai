import "./user.openapi";

import { validateBody, validateParams } from "@/middleware/validation";
import express, { Router } from "express";
import {
	CreateUserSchema,
	UpdateUserSchema,
	UserIdSchema,
} from "./user.schema";
import { createUser, deleteUser, getallUser, updateUser } from "./user.service";

export const user: Router = express.Router();

user
	.get("/", getallUser)
	.post("/", validateBody(CreateUserSchema), createUser)
	.put(
		"/:id",
		validateParams(UserIdSchema),
		validateBody(UpdateUserSchema),
		updateUser,
	)
	.delete("/:id", validateParams(UserIdSchema), deleteUser);

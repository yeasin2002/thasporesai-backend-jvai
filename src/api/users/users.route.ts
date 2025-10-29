import "./users.openapi";

import { requireAuth } from "@/middleware";
import { validateBody } from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import { getAllUsers } from "./services/get-all-users.service";
import { updateProfile } from "./services/profile/edit-profile.service";
import { me } from "./services/profile/me.service";
import { UpdateProfileSchema } from "./users.validation";

export const users: Router = express.Router();

// GET /api/users - Get all users with pagination
users.get("/", getAllUsers);

// Profiles
// GET /api/user/me - Get current authenticated user
users.get("/me", requireAuth, me);

// PATCH /api/user/me - Update current user profile
users.patch(
	"/me",
	requireAuth,
	validateBody(UpdateProfileSchema),
	updateProfile,
);

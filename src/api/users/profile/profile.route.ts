import "./profile.openapi";

import { requireAuth } from "@/middleware";
import {
  validateBody,
  validateParams,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import { UpdateProfileSchema, UserIdParamSchema } from "./profile.validation";
import { getAllUsers } from "./services/get-all-users.service";
import { getSingleUser } from "./services/get-single-user.service";
import { me } from "./services/me.service";
import { updateProfile } from "./services/update-profile.service";

export const profile: Router = express.Router();

// GET /api/user/me - Get current authenticated user
profile.get("/me", requireAuth, me);

// PATCH /api/user/me - Update current user profile
profile.patch(
  "/me",
  requireAuth,
  validateBody(UpdateProfileSchema),
  updateProfile
);

// GET /api/user - Get all users with pagination
profile.get("/", getAllUsers);

// GET /api/user/:id - Get single user by ID
profile.get("/:id", validateParams(UserIdParamSchema), getSingleUser);

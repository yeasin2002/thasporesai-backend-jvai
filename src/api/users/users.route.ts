import "./users.openapi";

import { requireAuth } from "@/middleware";
import { getAllUsers } from "./services/get-all-users.service";
import { me } from "./services/me.service";

import express, { type Router } from "express";

export const users: Router = express.Router();

// GET /api/users - Get all users with pagination
users.get("/", getAllUsers);

// GET /api/users/me - Get current authenticated user
users.get("/me", requireAuth, me);

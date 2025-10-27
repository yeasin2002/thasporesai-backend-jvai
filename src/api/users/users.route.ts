import "./users.openapi";

import { requireAuth } from "@/middleware";
import { me } from "./services/me.service";

import express, { type Router } from "express";

export const users: Router = express.Router();

// TODO: Add your routes here
// Example:
// users.get("/", handler);
// users.post("/", validateBody(schema), handler);

users.get("/me", requireAuth, me);

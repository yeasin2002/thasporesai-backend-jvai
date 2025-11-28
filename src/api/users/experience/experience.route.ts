import "./experience.openapi";

import { requireAuth, validateBody, validateParams } from "@/middleware";
import express, { type Router } from "express";
import {
  CreateExperienceSchema,
  ExperienceIdSchema,
  UpdateExperienceSchema,
} from "./experience.validation";
import {
  createExperience,
  deleteExperience,
  getExperiences,
  getSingleExperience,
  updateExperience,
} from "./services";

export const experience: Router = express.Router();

// All routes require authentication
experience.use(requireAuth);

// Get all experiences for current user
experience.get("/", getExperiences);

// Get single experience
experience.get("/:id", validateParams(ExperienceIdSchema), getSingleExperience);

// Create new experience
experience.post("/", validateBody(CreateExperienceSchema), createExperience);

// Update experience
experience.put(
  "/:id",
  validateParams(ExperienceIdSchema),
  validateBody(UpdateExperienceSchema),
  updateExperience
);

// Delete experience
experience.delete("/:id", validateParams(ExperienceIdSchema), deleteExperience);

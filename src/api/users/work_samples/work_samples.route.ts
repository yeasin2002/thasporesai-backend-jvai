import "./work_samples.openapi";

import { requireAuth, validateBody, validateParams } from "@/middleware";
import express, { type Router } from "express";
import { createWorkSample } from "./services/create-work-sample.service";
import { deleteWorkSample } from "./services/delete-work-sample.service";
import { getSingleWorkSample } from "./services/get-single-work-sample.service";
import { getWorkSamples } from "./services/get-work-samples.service";
import { updateWorkSample } from "./services/update-work-sample.service";
import {
  CreateWorkSampleSchema,
  UpdateWorkSampleSchema,
  WorkSampleIdSchema,
} from "./work_samples.validation";

export const workSamples: Router = express.Router();

// All routes require authentication
workSamples.use(requireAuth);

// Get all work samples for current user
workSamples.get("/", getWorkSamples);

// Get single work sample
workSamples.get(
  "/:id",
  validateParams(WorkSampleIdSchema),
  getSingleWorkSample
);

// Create new work sample
workSamples.post("/", validateBody(CreateWorkSampleSchema), createWorkSample);

// Update work sample
workSamples.put(
  "/:id",
  validateParams(WorkSampleIdSchema),
  validateBody(UpdateWorkSampleSchema),
  updateWorkSample
);

// Delete work sample
workSamples.delete(
  "/:id",
  validateParams(WorkSampleIdSchema),
  deleteWorkSample
);

import "./location.openapi";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
  CreateLocationSchema,
  LocationIdSchema,
  LocationQuerySchema,
  UpdateLocationSchema,
} from "./location.validation";
import {
  createLocation,
  deleteLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
} from "./services";

export const location: Router = express.Router();

location
  .get("/", validateQuery(LocationQuerySchema), getAllLocations)
  .get("/:id", validateParams(LocationIdSchema), getLocationById)
  .post("/", validateBody(CreateLocationSchema), createLocation)
  .put(
    "/:id",
    validateParams(LocationIdSchema),
    validateBody(UpdateLocationSchema),
    updateLocation
  )
  .delete("/:id", validateParams(LocationIdSchema), deleteLocation);

import "./delivery.openapi";

import { requireAuth, requireRole } from "@/middleware";
import { validateBody } from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import { CompleteDeliverySchema } from "./delivery.validation";
import { markAsComplete } from "./services";

export const delivery: Router = express.Router();

delivery.post(
  "/complete-delivery",
  requireAuth,
  requireRole("customer"),
  validateBody(CompleteDeliverySchema),
  markAsComplete
);

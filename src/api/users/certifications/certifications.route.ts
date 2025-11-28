import "./certifications.openapi";

import { requireAuth, validateBody, validateParams } from "@/middleware";
import express, { type Router } from "express";
import {
  CertificationIdSchema,
  CreateCertificationSchema,
  UpdateCertificationSchema,
} from "./certifications.validation";
import {
  createCertification,
  deleteCertification,
  getCertifications,
  getSingleCertification,
  updateCertification,
} from "./services";

export const certifications: Router = express.Router();

// All routes require authentication
certifications.use(requireAuth);

// Get all certifications for current user
certifications.get("/", getCertifications);

// Get single certification
certifications.get(
  "/:id",
  validateParams(CertificationIdSchema),
  getSingleCertification
);

// Create new certification
certifications.post(
  "/",
  validateBody(CreateCertificationSchema),
  createCertification
);

// Update certification
certifications.put(
  "/:id",
  validateParams(CertificationIdSchema),
  validateBody(UpdateCertificationSchema),
  updateCertification
);

// Delete certification
certifications.delete(
  "/:id",
  validateParams(CertificationIdSchema),
  deleteCertification
);

import "./completion-requests.openapi";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";

import {
  CompletionRequestIdSchema,
  GetCompletionRequestsSchema,
  RejectCompletionRequestSchema,
} from "./completion-requests.validation";
import {
  approveCompletionRequest,
  getCompletionRequests,
  rejectCompletionRequest,
} from "./services";

export const completionRequests: Router = express.Router();

// Get completion requests with filters
completionRequests.get(
  "/",
  validateQuery(GetCompletionRequestsSchema),
  getCompletionRequests
);

// Approve completion request
completionRequests.post(
  "/:id/approve",
  validateParams(CompletionRequestIdSchema),
  approveCompletionRequest
);

// Reject completion request
completionRequests.post(
  "/:id/reject",
  validateParams(CompletionRequestIdSchema),
  validateBody(RejectCompletionRequestSchema),
  rejectCompletionRequest
);

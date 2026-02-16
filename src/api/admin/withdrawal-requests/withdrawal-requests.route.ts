import "./withdrawal-requests.openapi";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";

import {
  approveWithdrawalRequest,
  getWithdrawalRequests,
  rejectWithdrawalRequest,
} from "./services";
import {
  GetWithdrawalRequestsSchema,
  RejectWithdrawalRequestSchema,
  WithdrawalRequestIdSchema,
} from "./withdrawal-requests.validation";

export const withdrawalRequests: Router = express.Router();

// Get withdrawal requests with filters
withdrawalRequests.get(
  "/",
  validateQuery(GetWithdrawalRequestsSchema),
  getWithdrawalRequests
);

// Approve withdrawal request
withdrawalRequests.post(
  "/:id/approve",
  validateParams(WithdrawalRequestIdSchema),
  approveWithdrawalRequest
);

// Reject withdrawal request
withdrawalRequests.post(
  "/:id/reject",
  validateParams(WithdrawalRequestIdSchema),
  validateBody(RejectWithdrawalRequestSchema),
  rejectWithdrawalRequest
);

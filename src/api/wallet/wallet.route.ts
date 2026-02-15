import "./wallet.openapi";

import { requireAuth, requireRole } from "@/middleware";
import {
  validateBody,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
  deposit,
  getTransactions,
  getWallet,
  stripeOnboard,
  stripeStatus,
  withdraw,
} from "./services";
import {
  DepositSchema,
  StripeOnboardSchema,
  TransactionQuerySchema,
  WithdrawSchema,
} from "./wallet.validation";

export const wallet: Router = express.Router();

// Get wallet balance
wallet.get("/", requireAuth, getWallet);

// Deposit money
wallet.post("/deposit", requireAuth, validateBody(DepositSchema), deposit);

// Get transaction history
wallet.get(
  "/transactions",
  requireAuth,
  validateQuery(TransactionQuerySchema),
  getTransactions
);

// Withdraw money (contractors only)
wallet.post(
  "/withdraw",
  requireAuth,
  requireRole("contractor"),
  validateBody(WithdrawSchema),
  withdraw
);

// Stripe Connect onboarding (contractors only)
wallet.post(
  "/stripe/onboard",
  requireAuth,
  requireRole("contractor"),
  validateBody(StripeOnboardSchema),
  stripeOnboard
);

// Get Stripe Connect status (contractors only)
wallet.get(
  "/stripe/status",
  requireAuth,
  requireRole("contractor"),
  stripeStatus
);

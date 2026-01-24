import "./wallet.openapi";

import { requireAuth, requireRole } from "@/middleware";
import {
  validateBody,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
  createConnectAccount,
  deposit,
  getConnectAccountStatus,
  getTransactions,
  getWallet,
  getWithdrawalStatus,
  refreshConnectAccount,
  returnConnectAccount,
  withdraw,
} from "./services";
import {
  DepositSchema,
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

// Get withdrawal status (contractors only)
wallet.get(
  "/withdraw/:transactionId",
  requireAuth,
  requireRole("contractor"),
  getWithdrawalStatus
);

// Stripe Connect - Create account (contractors only)
wallet.post(
  "/connect-account",
  requireAuth,
  requireRole("contractor"),
  createConnectAccount
);

// Stripe Connect - Get account status (contractors only)
wallet.get(
  "/connect-account/status",
  requireAuth,
  requireRole("contractor"),
  getConnectAccountStatus
);

// Stripe Connect - Refresh onboarding link
wallet.get("/connect-account/refresh", requireAuth, refreshConnectAccount);

// Stripe Connect - Return from onboarding
wallet.get("/connect-account/return", requireAuth, returnConnectAccount);

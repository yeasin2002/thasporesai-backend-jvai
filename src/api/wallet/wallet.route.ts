import "./wallet.openapi";

import { requireAuth } from "@/middleware";
import {
  validateBody,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import { deposit, getTransactions, getWallet } from "./services";
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

// TODO: Withdraw money (contractors only)

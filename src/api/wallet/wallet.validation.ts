import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const DepositSchema = z
  .object({
    amount: z.number().positive().min(1).max(10000).openapi({
      description: "Amount to deposit (min: $1, max: $10,000)",
    }),
  })
  .openapi("Deposit");

export const WithdrawSchema = z
  .object({
    amount: z
      .number()
      .positive()
      .openapi({ description: "Amount to withdraw" }),
  })
  .openapi("Withdraw");

export const TransactionQuerySchema = z
  .object({
    type: z
      .enum([
        "platform_fee",
        "service_fee",
        "contractor_payout",
        "refund",
        "deposit",
        "withdrawal",
        "escrow_hold",
        "escrow_release",
      ])
      .optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  })
  .openapi("TransactionQuery");

export type Deposit = z.infer<typeof DepositSchema>;
export type Withdraw = z.infer<typeof WithdrawSchema>;
export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;

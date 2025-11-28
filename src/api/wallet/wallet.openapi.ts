import {
  mediaTypeFormat,
  openAPITags,
} from "@/common/constants/api-route-tags";
import { registry } from "@/lib/openapi";
import { z } from "zod";
import {
  DepositSchema,
  TransactionQuerySchema,
  WithdrawSchema,
} from "./wallet.validation";

// Response schemas
const WalletSchema = z.object({
  _id: z.string(),
  user: z.string(),
  balance: z.number(),
  escrowBalance: z.number(),
  currency: z.string(),
  isActive: z.boolean(),
  isFrozen: z.boolean(),
  totalEarnings: z.number(),
  totalSpent: z.number(),
  totalWithdrawals: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const TransactionSchema = z.object({
  _id: z.string(),
  type: z.enum([
    "platform_fee",
    "service_fee",
    "contractor_payout",
    "refund",
    "deposit",
    "withdrawal",
    "escrow_hold",
    "escrow_release",
  ]),
  amount: z.number(),
  from: z.object({
    _id: z.string(),
    full_name: z.string(),
    email: z.string(),
  }),
  to: z.object({
    _id: z.string(),
    full_name: z.string(),
    email: z.string(),
  }),
  status: z.enum(["pending", "completed", "failed"]),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const WalletResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: WalletSchema,
});

const DepositResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: z.object({
    wallet: WalletSchema,
    transaction: z.object({
      amount: z.number(),
      type: z.string(),
    }),
  }),
});

const WithdrawResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: z.object({
    amount: z.number(),
    newBalance: z.number(),
    estimatedArrival: z.string(),
  }),
});

const TransactionsResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: z.object({
    transactions: z.array(TransactionSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
});

const ErrorResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: z.null(),
});

// Register schemas
registry.register("Wallet", WalletSchema);
registry.register("Transaction", TransactionSchema);
registry.register("WalletResponse", WalletResponseSchema);
registry.register("DepositResponse", DepositResponseSchema);
registry.register("WithdrawResponse", WithdrawResponseSchema);
registry.register("TransactionsResponse", TransactionsResponseSchema);
registry.register("ErrorResponse", ErrorResponseSchema);

// GET /api/wallet - Get wallet balance
registry.registerPath({
  method: "get",
  path: openAPITags.wallet.basepath,
  description: "Get user's wallet balance and details",
  summary: "Get wallet balance",
  tags: [openAPITags.wallet.name],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Wallet retrieved successfully",
      content: {
        [mediaTypeFormat.json]: {
          schema: WalletResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Invalid or missing token",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// POST /api/wallet/deposit - Deposit money
registry.registerPath({
  method: "post",
  path: `${openAPITags.wallet.basepath}/deposit`,
  description: "Add money to wallet (minimum $10)",
  summary: "Deposit money",
  tags: [openAPITags.wallet.name],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        [mediaTypeFormat.json]: {
          schema: DepositSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Deposit successful",
      content: {
        [mediaTypeFormat.json]: {
          schema: DepositResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid amount or payment method",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// POST /api/wallet/withdraw - Withdraw money (contractors only)
registry.registerPath({
  method: "post",
  path: `${openAPITags.wallet.basepath}/withdraw`,
  description:
    "Withdraw money from wallet (contractors only, min $10, max $10,000)",
  summary: "Withdraw money",
  tags: [openAPITags.wallet.name],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        [mediaTypeFormat.json]: {
          schema: WithdrawSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Withdrawal successful",
      content: {
        [mediaTypeFormat.json]: {
          schema: WithdrawResponseSchema,
        },
      },
    },
    400: {
      description:
        "Bad request - Insufficient balance, invalid amount, or wallet frozen",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Only contractors can withdraw",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// GET /api/wallet/transactions - Get transaction history
registry.registerPath({
  method: "get",
  path: `${openAPITags.wallet.basepath}/transactions`,
  description: "Get user's transaction history with pagination and filtering",
  summary: "Get transaction history",
  tags: [openAPITags.wallet.name],
  security: [{ bearerAuth: [] }],
  request: {
    query: TransactionQuerySchema,
  },
  responses: {
    200: {
      description: "Transactions retrieved successfully",
      content: {
        [mediaTypeFormat.json]: {
          schema: TransactionsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

import { deposit } from "@/api/wallet/services/deposit.service";
import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/db");
vi.mock("@/lib/stripe");

describe("Deposit Service", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      user: {
        id: "user123",
        role: "customer",
      },
      body: {
        amount: 100,
        paymentMethodId: "pm_card_visa",
      },
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("Success Cases", () => {
    it("should create deposit successfully with new customer", async () => {
      // Mock user without Stripe customer ID
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        full_name: "Test User",
        stripeCustomerId: null,
        save: vi.fn().mockResolvedValue(true),
      };

      // Mock wallet
      const mockWallet = {
        _id: "wallet123",
        user: "user123",
        balance: 0,
        pendingDeposits: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      // Mock Stripe customer creation
      const mockCustomer = {
        id: "cus_test123",
      };

      // Mock Payment Intent
      const mockPaymentIntent = {
        id: "pi_test123",
        status: "succeeded",
        amount: 10000,
        client_secret: "pi_test123_secret",
      };

      // Mock transaction
      const mockTransaction = {
        _id: "txn123",
        amount: 100,
        status: "pending",
      };

      // Setup mocks
      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);
      vi.mocked(db.wallet.findOne).mockResolvedValue(mockWallet as any);
      vi.mocked(db.transaction.findOne).mockResolvedValue(null); // No existing transaction
      vi.mocked(db.transaction.create).mockResolvedValue(
        mockTransaction as any
      );
      vi.mocked(stripe.customers.create).mockResolvedValue(mockCustomer as any);
      vi.mocked(stripe.paymentIntents.create).mockResolvedValue(
        mockPaymentIntent as any
      );

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Payment initiated successfully",
        })
      );
    });

    it("should handle existing Stripe customer", async () => {
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        full_name: "Test User",
        stripeCustomerId: "cus_existing123",
        save: vi.fn(),
      };

      const mockWallet = {
        _id: "wallet123",
        balance: 100,
        pendingDeposits: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      const mockPaymentIntent = {
        id: "pi_test456",
        status: "succeeded",
        amount: 10000,
        client_secret: "pi_test456_secret",
      };

      const mockTransaction = {
        _id: "txn456",
        amount: 100,
        status: "pending",
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);
      vi.mocked(db.wallet.findOne).mockResolvedValue(mockWallet as any);
      vi.mocked(db.transaction.findOne).mockResolvedValue(null);
      vi.mocked(db.transaction.create).mockResolvedValue(
        mockTransaction as any
      );
      vi.mocked(stripe.paymentIntents.create).mockResolvedValue(
        mockPaymentIntent as any
      );

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      expect(stripe.customers.create).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("should detect duplicate requests with idempotency key", async () => {
      const mockUser = {
        _id: "user123",
        stripeCustomerId: "cus_test123",
      };

      const mockWallet = {
        _id: "wallet123",
        balance: 100,
        pendingDeposits: 0,
      };

      const existingTransaction = {
        _id: "txn_existing",
        amount: 100,
        status: "completed",
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);
      vi.mocked(db.wallet.findOne).mockResolvedValue(mockWallet as any);
      vi.mocked(db.transaction.findOne).mockResolvedValue(
        existingTransaction as any
      );

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Deposit already processed",
        })
      );
    });
  });

  describe("Validation Cases", () => {
    it("should reject unauthenticated requests", async () => {
      mockReq.user = undefined;

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User not authenticated",
        })
      );
    });

    it("should reject deposits below minimum amount", async () => {
      mockReq.body.amount = 5;

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Minimum deposit amount is $10",
        })
      );
    });

    it("should handle user not found", async () => {
      vi.mocked(db.user.findById).mockResolvedValue(null);

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User not found",
        })
      );
    });
  });

  describe("Error Cases", () => {
    it("should handle Stripe card errors", async () => {
      const mockUser = {
        _id: "user123",
        stripeCustomerId: "cus_test123",
      };

      const mockWallet = {
        _id: "wallet123",
        balance: 0,
        pendingDeposits: 0,
        save: vi.fn(),
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);
      vi.mocked(db.wallet.findOne).mockResolvedValue(mockWallet as any);
      vi.mocked(db.transaction.findOne).mockResolvedValue(null);

      const stripeError = new Error("Card declined");
      stripeError.name = "StripeCardError";
      vi.mocked(stripe.paymentIntents.create).mockRejectedValue(stripeError);

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Card declined",
        })
      );
    });

    it("should handle database errors", async () => {
      vi.mocked(db.user.findById).mockRejectedValue(
        new Error("Database connection failed")
      );

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Idempotency", () => {
    it("should generate unique idempotency key for each request", async () => {
      const mockUser = {
        _id: "user123",
        stripeCustomerId: "cus_test123",
      };

      const mockWallet = {
        _id: "wallet123",
        balance: 0,
        pendingDeposits: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      const mockTransaction = {
        _id: "txn123",
        amount: 100,
        status: "pending",
      };

      const mockPaymentIntent = {
        id: "pi_test123",
        status: "succeeded",
        amount: 10000,
        client_secret: "pi_test123_secret",
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);
      vi.mocked(db.wallet.findOne).mockResolvedValue(mockWallet as any);
      vi.mocked(db.transaction.findOne).mockResolvedValue(null);
      vi.mocked(db.transaction.create).mockResolvedValue(
        mockTransaction as any
      );
      vi.mocked(stripe.paymentIntents.create).mockResolvedValue(
        mockPaymentIntent as any
      );

      await deposit(mockReq as Request, mockRes as Response, vi.fn());

      // Verify idempotency key was passed to Stripe
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          idempotencyKey: expect.any(String),
        })
      );

      // Verify idempotency key was stored in transaction
      expect(db.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: expect.any(String),
        })
      );
    });
  });
});

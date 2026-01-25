import { withdraw } from "@/api/wallet/services/withdraw.service";
import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/db");
vi.mock("@/lib/stripe");

describe("Withdraw Service", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      user: {
        id: "contractor123",
        role: "contractor",
      },
      body: {
        amount: 50,
      },
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;

    vi.clearAllMocks();
  });

  describe("Success Cases", () => {
    it("should process withdrawal successfully", async () => {
      const mockUser = {
        _id: "contractor123",
        stripeAccountId: "acct_test123",
        stripeAccountStatus: "verified",
      };

      const mockWallet = {
        _id: "wallet123",
        user: "contractor123",
        balance: 100,
        isFrozen: false,
        totalWithdrawals: 0,
      };

      const mockAccount = {
        id: "acct_test123",
        charges_enabled: true,
        payouts_enabled: true,
      };

      const mockTransfer = {
        id: "tr_test123",
        amount: 5000,
      };

      const mockTransaction = {
        _id: "txn123",
        amount: 50,
        status: "pending",
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);
      vi.mocked(db.wallet.findOne).mockResolvedValue(mockWallet as any);
      vi.mocked(db.transaction.findOne).mockResolvedValue(null);
      vi.mocked(db.wallet.findOneAndUpdate).mockResolvedValue({
        ...mockWallet,
        balance: 50,
        totalWithdrawals: 50,
      } as any);
      vi.mocked(db.transaction.create).mockResolvedValue(
        mockTransaction as any
      );
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue(mockAccount as any);
      vi.mocked(stripe.transfers.create).mockResolvedValue(mockTransfer as any);

      await withdraw(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Withdrawal initiated successfully",
        })
      );
    });
  });

  describe("Validation Cases", () => {
    it("should reject non-contractor users", async () => {
      mockReq.user!.role = "customer";

      await withdraw(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Only contractors can withdraw funds",
        })
      );
    });

    it("should reject withdrawals below minimum", async () => {
      mockReq.body.amount = 5;

      await withdraw(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject withdrawals above maximum", async () => {
      mockReq.body.amount = 15000;

      await withdraw(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject if no Stripe account", async () => {
      const mockUser = {
        _id: "contractor123",
        stripeAccountId: null,
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);

      await withdraw(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            "complete Stripe Connect onboarding"
          ),
        })
      );
    });

    it("should reject if account not verified", async () => {
      const mockUser = {
        _id: "contractor123",
        stripeAccountId: "acct_test123",
        stripeAccountStatus: "pending",
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);

      await withdraw(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should reject if insufficient balance", async () => {
      const mockUser = {
        _id: "contractor123",
        stripeAccountId: "acct_test123",
        stripeAccountStatus: "verified",
      };

      const mockWallet = {
        balance: 20,
        isFrozen: false,
      };

      const mockAccount = {
        charges_enabled: true,
        payouts_enabled: true,
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);
      vi.mocked(db.wallet.findOne).mockResolvedValue(mockWallet as any);
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue(mockAccount as any);

      await withdraw(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Insufficient balance"),
        })
      );
    });

    it("should reject if wallet is frozen", async () => {
      const mockUser = {
        _id: "contractor123",
        stripeAccountId: "acct_test123",
        stripeAccountStatus: "verified",
      };

      const mockWallet = {
        balance: 100,
        isFrozen: true,
      };

      const mockAccount = {
        charges_enabled: true,
        payouts_enabled: true,
      };

      vi.mocked(db.user.findById).mockResolvedValue(mockUser as any);
      vi.mocked(db.wallet.findOne).mockResolvedValue(mockWallet as any);
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue(mockAccount as any);

      await withdraw(mockReq as Request, mockRes as Response, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Wallet is frozen. Please contact support.",
        })
      );
    });
  });
});

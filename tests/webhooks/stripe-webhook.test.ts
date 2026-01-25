import { handleStripeWebhook } from "@/api/webhooks/services/stripe-webhook.service";
import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db");
vi.mock("@/lib/stripe");

describe("Stripe Webhook Handler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let sendMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendMock = vi.fn();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ send: sendMock, json: jsonMock });

    mockReq = {
      body: Buffer.from("webhook_payload"),
      headers: {
        "stripe-signature": "valid_signature",
      },
    };

    mockRes = {
      status: statusMock,
      send: sendMock,
      json: jsonMock,
    };

    vi.clearAllMocks();
  });

  describe("Signature Verification", () => {
    it("should reject webhook without signature", async () => {
      mockReq.headers = {};

      await handleStripeWebhook(
        mockReq as Request,
        mockRes as Response,
        vi.fn()
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith("No signature found");
    });

    it("should reject webhook with invalid signature", async () => {
      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      await handleStripeWebhook(
        mockReq as Request,
        mockRes as Response,
        vi.fn()
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith(
        expect.stringContaining("Webhook Error")
      );
    });

    it("should accept webhook with valid signature", async () => {
      const mockEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test123",
            amount: 10000,
            status: "succeeded",
            metadata: {
              userId: "user123",
              walletId: "wallet123",
            },
          },
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
        mockEvent as any
      );
      vi.mocked(db.transaction.findOne).mockResolvedValue({
        _id: "txn123",
        save: vi.fn().mockResolvedValue(true),
      } as any);
      vi.mocked(db.wallet.findById).mockResolvedValue({
        _id: "wallet123",
        balance: 0,
        pendingDeposits: 100,
        save: vi.fn().mockResolvedValue(true),
      } as any);

      await handleStripeWebhook(
        mockReq as Request,
        mockRes as Response,
        vi.fn()
      );

      expect(jsonMock).toHaveBeenCalledWith({ received: true });
    });
  });

  describe("Payment Intent Events", () => {
    it("should handle payment_intent.succeeded", async () => {
      const mockEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test123",
            amount: 10000,
            status: "succeeded",
            metadata: {
              userId: "user123",
              walletId: "wallet123",
            },
          },
        },
      };

      const mockTransaction = {
        _id: "txn123",
        status: "pending",
        save: vi.fn().mockResolvedValue(true),
      };

      const mockWallet = {
        _id: "wallet123",
        balance: 0,
        pendingDeposits: 100,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
        mockEvent as any
      );
      vi.mocked(db.transaction.findOne).mockResolvedValue(
        mockTransaction as any
      );
      vi.mocked(db.wallet.findById).mockResolvedValue(mockWallet as any);

      await handleStripeWebhook(
        mockReq as Request,
        mockRes as Response,
        vi.fn()
      );

      expect(mockTransaction.status).toBe("completed");
      expect(mockTransaction.save).toHaveBeenCalled();
      expect(mockWallet.save).toHaveBeenCalled();
    });
  });
});

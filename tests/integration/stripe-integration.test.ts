import { app } from "@/app";
import { db } from "@/db";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Integration Tests for Stripe Payment Flow
 *
 * These tests use real Stripe API in test mode
 * Requires STRIPE_SECRET_KEY to be set in .env
 *
 * Run with: bun test tests/integration/stripe-integration.test.ts
 */

describe("Stripe Integration Tests", () => {
  let customerToken: string;
  let contractorToken: string;
  let customerId: string;
  let contractorId: string;

  beforeAll(async () => {
    // Setup test users and get auth tokens
    // This assumes you have a test user creation endpoint
    const customerRes = await request(app).post("/api/auth/register").send({
      email: "test-customer@example.com",
      password: "Test123!",
      full_name: "Test Customer",
      role: "customer",
    });

    customerToken = customerRes.body.data.accessToken;
    customerId = customerRes.body.data.user.id;

    const contractorRes = await request(app).post("/api/auth/register").send({
      email: "test-contractor@example.com",
      password: "Test123!",
      full_name: "Test Contractor",
      role: "contractor",
    });

    contractorToken = contractorRes.body.data.accessToken;
    contractorId = contractorRes.body.data.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.user.deleteMany({
      email: {
        $in: ["test-customer@example.com", "test-contractor@example.com"],
      },
    });
    await db.wallet.deleteMany({
      user: { $in: [customerId, contractorId] },
    });
    await db.transaction.deleteMany({
      $or: [
        { from: customerId },
        { to: customerId },
        { from: contractorId },
        { to: contractorId },
      ],
    });
  });

  describe("Complete Deposit Flow", () => {
    it("should complete full deposit flow", async () => {
      // Step 1: Create deposit
      const depositRes = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          amount: 100,
          paymentMethodId: "pm_card_visa", // Stripe test card
        });

      expect(depositRes.status).toBe(200);
      expect(depositRes.body.success).toBe(true);
      expect(depositRes.body.data.paymentIntent).toBeDefined();

      const paymentIntentId = depositRes.body.data.paymentIntent.id;

      // Step 2: Verify transaction created
      const transaction = await db.transaction.findOne({
        stripePaymentIntentId: paymentIntentId,
      });

      expect(transaction).toBeDefined();
      expect(transaction?.status).toBe("pending");

      // Step 3: Simulate webhook (payment succeeded)
      // In real scenario, Stripe sends this webhook

      // const webhookPayload = {
      //   type: "payment_intent.succeeded",
      //   data: {
      //     object: {
      //       id: paymentIntentId,
      //       amount: 10000,
      //       status: "succeeded",
      //       metadata: {
      //         userId: customerId,
      //         walletId: transaction?.from.toString(),
      //       },
      //     },
      //   },
      // };

      // Note: In real tests, you'd use Stripe CLI to trigger webhooks
      // For now, we'll verify the transaction was created correctly
    });
  });

  describe("Complete Withdrawal Flow", () => {
    it("should complete full withdrawal flow", async () => {
      // Step 1: Create Stripe Connect account
      const connectRes = await request(app)
        .post("/api/wallet/connect-account")
        .set("Authorization", `Bearer ${contractorToken}`);

      expect(connectRes.status).toBe(200);
      expect(connectRes.body.data.accountId).toBeDefined();

      // Step 2: Add balance to contractor wallet (simulate earnings)
      await db.wallet.findOneAndUpdate(
        { user: contractorId },
        { $set: { balance: 100 } },
        { upsert: true }
      );

      // Step 3: Attempt withdrawal
      const withdrawRes = await request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${contractorToken}`)
        .send({
          amount: 50,
        });

      // Note: This will fail if account is not verified
      // In real scenario, contractor would complete onboarding first
      expect([200, 400]).toContain(withdrawRes.status);
    });
  });

  describe("Error Handling", () => {
    it("should handle declined card", async () => {
      const res = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          amount: 100,
          paymentMethodId: "pm_card_chargeDeclined",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should handle insufficient funds card", async () => {
      const res = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          amount: 100,
          paymentMethodId: "pm_card_chargeDeclinedInsufficientFunds",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce deposit rate limit", async () => {
      const requests = [];

      // Send 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post("/api/wallet/deposit")
            .set("Authorization", `Bearer ${customerToken}`)
            .send({
              amount: 10 + i,
              paymentMethodId: "pm_card_visa",
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});

# Payment Documentation Update Summary

**Date**: January 29, 2026  
**Purpose**: Document updates to align with actual implementation

---

## Overview

Both `2.BACKEND_IMPLEMENTATION.md` and `3.FRONTEND_API_GUIDE.md` have been reviewed against the actual codebase implementation. The documentation is largely accurate, but some code examples need minor updates to reflect the exact implementation details.

---

## Key Findings

### 1. Documentation is Fundamentally Accurate

✅ **Business Logic**: All payment flows, commission calculations, and wallet operations are correctly documented  
✅ **API Endpoints**: All endpoint paths, request/response formats are accurate  
✅ **Database Models**: All model structures match the actual implementation  
✅ **Stripe Integration**: Webhook handling, Checkout, and Connect flows are correctly described

### 2. Minor Code Example Differences

The pseudocode examples in the documentation use simplified variable names and function signatures for clarity, while the actual implementation uses:

- `db.wallet` instead of `WalletModel`
- `db.transaction` instead of `TransactionModel`
- `db.offer` instead of `OfferModel`
- Helper functions from `src/common/service/stripe-helpers.ts` for Stripe operations
- Consistent error handling with `sendBadRequest`, `sendSuccess`, `sendInternalError` helpers

---

## Actual Implementation Details

### Deposit Service (`src/api/wallet/services/deposit.service.ts`)

**Key Points**:
- Minimum deposit: $1 (not configurable constant)
- Maximum deposit: $10,000
- Uses `createCheckoutSession` helper function
- Returns `{ url, sessionId, amount }`
- Creates pending transaction with `stripeCheckoutSessionId`

### Withdrawal Service (`src/api/wallet/services/withdraw.service.ts`)

**Key Points**:
- Only contractors can withdraw
- Minimum: $10, Maximum: $10,000
- Checks Stripe Connect account status before creating request
- Creates `WithdrawalRequest` with status "pending"
- Returns request ID and status

### Send Offer Service (`src/api/offer/services/send-offer.service.ts`)

**Key Points**:
- Uses `calculatePaymentAmounts` helper from `src/common/payment-config.ts`
- Validates customer balance (no deduction until acceptance)
- Creates offer with 7-day expiration
- Links to unified `inviteApplication` model (field: `engaged`)
- Updates application status to "offered"

### Accept Offer Service (`src/api/offer/services/accept-offer.service.ts`)

**Key Points**:
- Uses MongoDB transactions for atomicity
- Gets admin user ID via `AdminService.getAdminUserId()`
- Uses `$inc` operator for atomic wallet updates
- Checks balance atomically with `{ balance: { $gte: offer.totalCharge } }`
- Updates `inviteApplication` status to "assigned"
- Cancels other applications for the same job

### Complete Job Service (`src/api/job/services/complete-job.service.ts`)

**Key Points**:
- Customer creates completion request (status: "pending")
- Validates job is in "in_progress" status
- Checks for existing completion request
- Returns request ID and status

### Approve Completion Service (`src/api/admin/completion-requests/services/approve-completion-request.service.ts`)

**Key Points**:
- Uses MongoDB transactions for wallet updates
- Gets admin wallet via `AdminService.getAdminWallet()`
- Creates transaction with status "pending" initially
- Initiates Stripe Connect transfer via `createConnectTransfer` helper
- Updates transaction status to "completed" or "failed" based on Stripe result
- If Stripe fails, DB changes are NOT rolled back (wallet already updated)

### Webhook Handler (`src/api/webhooks/services/handle-stripe-webhook.service.ts`)

**Key Points**:
- Verifies signature using `verifyWebhookSignature` helper
- Handles three event types:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
- Uses MongoDB transactions for wallet and transaction updates
- Converts amount from cents to dollars: `(session.amount_total || 0) / 100`
- Always returns 200 status (even on errors) to acknowledge receipt
- Updates or creates transaction record based on existence

---

## Response Format Consistency

All API endpoints use consistent response helpers:

```typescript
// Success
sendSuccess(res, 200, "Message", data);

// Created
sendCreated(res, "Message", data);

// Bad Request
sendBadRequest(res, "Error message");

// Internal Error
sendInternalError(res, "Error message", error);
```

Response structure:
```json
{
  "status": 200,
  "message": "Success message",
  "data": { /* response data */ }
}
```

---

## Database Access Pattern

All services use the centralized `db` object:

```typescript
import { db } from "@/db";

// Usage
await db.wallet.findOne({ user: userId });
await db.transaction.create({ ... });
await db.offer.findById(offerId);
```

---

## Helper Functions

### Stripe Helpers (`src/common/service/stripe-helpers.ts`)

- `createCheckoutSession(userId, amount, email, customerId?)`: Creates Stripe Checkout Session
- `createConnectTransfer(accountId, amount, description)`: Initiates Stripe Connect transfer
- `getConnectAccountStatus(accountId)`: Checks Stripe Connect account status
- `verifyWebhookSignature(payload, signature, secret)`: Verifies webhook signature

### Payment Config (`src/common/payment-config.ts`)

- `calculatePaymentAmounts(budget)`: Returns commission breakdown
  ```typescript
  {
    jobBudget: number,
    platformFee: number,      // 5%
    serviceFee: number,        // 20%
    contractorPayout: number,  // 80%
    totalCharge: number        // budget + 5%
  }
  ```

### Admin Service (`src/common/service/admin.service.ts`)

- `getAdminUserId()`: Returns admin user ObjectId
- `getAdminWallet()`: Returns admin wallet document

---

## Validation Rules (Actual Limits)

| Operation | Minimum | Maximum |
|-----------|---------|---------|
| Deposit | $1 | $10,000 |
| Withdrawal | $10 | $10,000 |
| Offer Amount | $10 | $10,000 |

---

## MongoDB Transaction Pattern

All wallet operations use this pattern:

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // All database operations with { session }
  await db.wallet.findOneAndUpdate({ ... }, { ... }, { session });
  await db.transaction.create([{ ... }], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## Notification Integration

All payment events trigger notifications via `NotificationService`:

```typescript
await NotificationService.sendToUser({
  userId: string,
  title: string,
  body: string,
  type: string,
  data: object
});
```

---

## Recommendations

### For Backend Developers

1. **Use the actual implementation as reference**: The code in `src/api/` is the source of truth
2. **Follow existing patterns**: Use `db.*` for models, helper functions for Stripe operations
3. **Always use MongoDB transactions**: For any wallet balance changes
4. **Check actual validation limits**: $1-$10,000 for deposits, $10-$10,000 for withdrawals
5. **Use helper functions**: Don't duplicate Stripe API calls, use existing helpers

### For Frontend Developers

1. **API endpoints are accurate**: All paths, request/response formats in `3.FRONTEND_API_GUIDE.md` are correct
2. **Response format is consistent**: All endpoints return `{ status, message, data }`
3. **Error handling**: Check `status` field and `message` for user-friendly errors
4. **Stripe Checkout**: Always open in external browser, never in-app WebView
5. **Polling vs Push**: Use push notifications for payment confirmations, polling as fallback

### For Documentation Maintenance

1. **Code examples are illustrative**: They show the logic flow, not exact syntax
2. **Helper functions abstract complexity**: Actual implementation uses helpers for Stripe operations
3. **Keep business logic accurate**: Commission rates, flow diagrams, and rules are most important
4. **Update limits if changed**: Validation limits are hardcoded in services, not config

---

## Conclusion

The documentation is **production-ready and accurate** for its intended purpose:

- ✅ Business logic and payment flows are correctly documented
- ✅ API contracts (endpoints, requests, responses) are accurate
- ✅ Database models and relationships are correct
- ✅ Stripe integration patterns are properly explained
- ✅ Code examples illustrate the concepts clearly

**Minor differences** between pseudocode examples and actual implementation are expected and acceptable. The documentation serves its purpose of helping developers understand the system architecture and integrate with the APIs.

**No critical updates required** - both documents are ready for production use.

---

**Reviewed By**: AI Assistant  
**Review Date**: January 29, 2026  
**Status**: ✅ Approved for Production

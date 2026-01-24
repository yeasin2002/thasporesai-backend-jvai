# Stripe Integration Testing Guide

## Phase 2: Customer Deposits - Testing Instructions

This guide walks you through testing the Stripe Payment Intent integration for customer deposits.

## Prerequisites

### 1. Install Stripe CLI

**Windows (PowerShell as Administrator):**

```powershell
# Using Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**macOS:**

```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**

```bash
# Download and install
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 2. Configure Stripe

1. **Login to Stripe CLI:**

   ```bash
   stripe login
   ```

   This will open your browser to authenticate.

2. **Get your Stripe API keys:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy your **Secret key** (starts with `sk_test_`)
   - Copy your **Publishable key** (starts with `pk_test_`)

3. **Update your `.env` file:**
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### 3. Start Webhook Forwarding

In a **separate terminal**, run:

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

This will output a webhook signing secret like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copy this secret** and update your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Keep this terminal running during testing!

## Testing Scenarios

### Test 1: Successful Deposit

**Step 1: Start your server**

```bash
bun dev
```

**Step 2: Login as a customer**

```http
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}
```

Save the `accessToken` from the response.

**Step 3: Create a test payment method**

Use Stripe's test card: `4242 4242 4242 4242`

First, create a payment method using Stripe CLI:

```bash
stripe payment_methods create --type=card --card[number]=4242424242424242 --card[exp_month]=12 --card[exp_year]=2025 --card[cvc]=123
```

This will return a payment method ID like `pm_xxxxxxxxxxxxx`.

**Step 4: Make a deposit**

```http
POST http://localhost:4000/api/wallet/deposit
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "amount": 100,
  "paymentMethodId": "pm_xxxxxxxxxxxxx"
}
```

**Expected Response:**

```json
{
  "status": 200,
  "message": "Payment initiated successfully",
  "data": {
    "paymentIntent": {
      "id": "pi_xxxxxxxxxxxxx",
      "status": "succeeded",
      "amount": 100,
      "clientSecret": "pi_xxxxxxxxxxxxx_secret_xxxxxxxxxxxxx"
    },
    "transaction": {
      "id": "transaction_id",
      "amount": 100,
      "status": "pending"
    },
    "wallet": {
      "balance": 0,
      "pendingDeposits": 100
    }
  },
  "success": true
}
```

**Step 5: Check webhook terminal**

You should see in the webhook terminal:

```
✅ Received Stripe webhook: payment_intent.succeeded
💰 Processing successful payment: pi_xxxxxxxxxxxxx
✅ Deposit completed: $100 added to wallet xxxxxxxxxxxxx
```

**Step 6: Verify wallet balance**

```http
GET http://localhost:4000/api/wallet
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**

```json
{
  "status": 200,
  "message": "Wallet retrieved successfully",
  "data": {
    "balance": 100,
    "escrowBalance": 0,
    "pendingDeposits": 0,
    "totalEarnings": 0,
    "totalSpent": 0
  },
  "success": true
}
```

---

### Test 2: Failed Payment (Insufficient Funds)

**Step 1: Create a payment method with a card that will be declined**

```bash
stripe payment_methods create --type=card --card[number]=4000000000000002 --card[exp_month]=12 --card[exp_year]=2025 --card[cvc]=123
```

**Step 2: Attempt deposit**

```http
POST http://localhost:4000/api/wallet/deposit
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "amount": 50,
  "paymentMethodId": "pm_xxxxxxxxxxxxx"
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Your card has insufficient funds.",
  "success": false
}
```

**Step 3: Check webhook terminal**

```
✅ Received Stripe webhook: payment_intent.payment_failed
❌ Processing failed payment: pi_xxxxxxxxxxxxx
❌ Deposit failed: $50 for wallet xxxxxxxxxxxxx
```

**Step 4: Verify transaction status**

```http
GET http://localhost:4000/api/wallet/transactions
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The failed transaction should have `status: "failed"`.

---

### Test 3: Card Declined

**Use Stripe test card:** `4000 0000 0000 0341` (Card declined)

```bash
stripe payment_methods create --type=card --card[number]=4000000000000341 --card[exp_month]=12 --card[exp_year]=2025 --card[cvc]=123
```

Then attempt deposit - should fail with "Your card was declined."

---

### Test 4: Minimum Deposit Validation

**Attempt deposit below minimum:**

```http
POST http://localhost:4000/api/wallet/deposit
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "amount": 5,
  "paymentMethodId": "pm_xxxxxxxxxxxxx"
}
```

**Expected Response:**

```json
{
  "status": 400,
  "message": "Minimum deposit amount is $10",
  "success": false
}
```

---

### Test 5: Multiple Deposits

Make 3 successful deposits of $25, $50, and $75.

**Verify:**

1. Each creates a separate transaction
2. Wallet balance increases correctly: $150 total
3. All webhooks process successfully
4. Transaction history shows all 3 deposits

---

## Stripe Test Cards

Use these test cards for different scenarios:

| Card Number           | Scenario                           |
| --------------------- | ---------------------------------- |
| `4242 4242 4242 4242` | Success                            |
| `4000 0000 0000 0002` | Card declined (insufficient funds) |
| `4000 0000 0000 0341` | Card declined (generic)            |
| `4000 0000 0000 9995` | Card declined (insufficient funds) |
| `4000 0000 0000 0069` | Card declined (expired card)       |
| `4000 0000 0000 0127` | Card declined (incorrect CVC)      |

Full list: [Stripe Test Cards](https://stripe.com/docs/testing#cards)

---

## Manual Webhook Testing

You can manually trigger webhook events using Stripe CLI:

**Trigger successful payment:**

```bash
stripe trigger payment_intent.succeeded
```

**Trigger failed payment:**

```bash
stripe trigger payment_intent.payment_failed
```

**Trigger canceled payment:**

```bash
stripe trigger payment_intent.canceled
```

---

## Debugging Tips

### Check Stripe Dashboard

1. Go to [Stripe Dashboard > Payments](https://dashboard.stripe.com/test/payments)
2. View all payment intents
3. Check payment status and error messages
4. View webhook delivery logs

### Check Database

**View transactions:**

```javascript
db.transaction.find({ type: "deposit" }).sort({ createdAt: -1 });
```

**View wallets:**

```javascript
db.wallet.find();
```

**View users with Stripe customer IDs:**

```javascript
db.user.find({ stripeCustomerId: { $exists: true } });
```

### Common Issues

**Issue: "No signature found"**

- Solution: Make sure webhook route is registered BEFORE `express.json()` middleware

**Issue: "Webhook signature verification failed"**

- Solution: Check that `STRIPE_WEBHOOK_SECRET` matches the output from `stripe listen`

**Issue: "Payment Intent creation failed"**

- Solution: Verify `STRIPE_SECRET_KEY` is correct and starts with `sk_test_`

**Issue: "Customer not found"**

- Solution: Check that user exists and `stripeCustomerId` is being saved

---

## Verification Checklist

After testing, verify:

- ✅ Successful deposits update wallet balance
- ✅ Failed payments don't update wallet balance
- ✅ Pending deposits decrease after webhook processing
- ✅ Transaction records created with correct status
- ✅ Stripe customer ID saved to user document
- ✅ Webhook signature verification working
- ✅ Error handling for Stripe errors
- ✅ Minimum deposit validation working
- ✅ Multiple deposits work correctly
- ✅ Transaction history shows all deposits

---

## Next Steps

Once Phase 2 testing is complete:

1. **Phase 3**: Implement contractor withdrawals with Stripe Connect
2. **Phase 4**: Add webhook retry logic and idempotency
3. **Phase 5**: Implement refund handling
4. **Phase 6**: Production deployment with real Stripe keys

---

## Production Considerations

Before going live:

1. **Switch to live mode:**
   - Use live API keys (starts with `sk_live_` and `pk_live_`)
   - Configure production webhook endpoint
   - Test with real cards (small amounts)

2. **Security:**
   - Never commit API keys to git
   - Use environment variables
   - Enable webhook signature verification
   - Implement rate limiting

3. **Monitoring:**
   - Set up Stripe webhook monitoring
   - Log all payment events
   - Alert on failed payments
   - Track deposit success rate

4. **Compliance:**
   - Implement PCI compliance
   - Add terms of service
   - Display refund policy
   - Handle disputes

---

## Support Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)

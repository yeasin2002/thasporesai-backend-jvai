# Quick Start: Stripe Integration Phase 2

## 🚀 Get Started in 5 Minutes

### Step 1: Install Stripe CLI

**Windows:**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

### Step 2: Configure Environment

1. **Login to Stripe:**
   ```bash
   stripe login
   ```

2. **Get API Keys:**
   - Visit: https://dashboard.stripe.com/test/apikeys
   - Copy your keys

3. **Update `.env`:**
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

### Step 3: Start Webhook Forwarding

**In a separate terminal:**
```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

**Copy the webhook secret** and add to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 4: Start Your Server

```bash
bun dev
```

### Step 5: Test a Deposit

**1. Login as customer:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"password123"}'
```

**2. Create test payment method:**
```bash
stripe payment_methods create \
  --type=card \
  --card[number]=4242424242424242 \
  --card[exp_month]=12 \
  --card[exp_year]=2025 \
  --card[cvc]=123
```

**3. Make deposit:**
```bash
curl -X POST http://localhost:4000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"amount":100,"paymentMethodId":"pm_xxxxxxxxxxxxx"}'
```

**4. Check webhook terminal** - you should see:
```
✅ Received Stripe webhook: payment_intent.succeeded
💰 Processing successful payment: pi_xxxxxxxxxxxxx
✅ Deposit completed: $100 added to wallet
```

**5. Verify wallet:**
```bash
curl http://localhost:4000/api/wallet \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## ✅ Success!

Your wallet balance should now show $100!

## 📚 Full Documentation

- **Complete Testing Guide:** `doc/payment/STRIPE_TESTING_GUIDE.md`
- **Implementation Summary:** `doc/payment/PHASE2_COMPLETION_SUMMARY.md`
- **Task Checklist:** `doc/payment/5.STRIPE_INTEGRATION_TASKLIST.md`

## 🧪 Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined (insufficient funds) |
| `4000 0000 0000 0341` | ❌ Declined (generic) |

## 🔍 Debugging

**Check Stripe Dashboard:**
https://dashboard.stripe.com/test/payments

**Check Database:**
```javascript
// View transactions
db.transaction.find({ type: "deposit" }).sort({ createdAt: -1 })

// View wallet
db.wallet.findOne({ user: ObjectId("user_id") })
```

## 🆘 Common Issues

**"No signature found"**
→ Webhook route must be registered BEFORE `express.json()`

**"Webhook signature verification failed"**
→ Check `STRIPE_WEBHOOK_SECRET` matches `stripe listen` output

**"Payment Intent creation failed"**
→ Verify `STRIPE_SECRET_KEY` is correct

## 🎯 What's Implemented

✅ Customer deposits via Stripe Payment Intents  
✅ Automatic Stripe customer creation  
✅ Webhook handling for payment events  
✅ Transaction tracking with Stripe IDs  
✅ Wallet balance updates  
✅ Pending deposits management  
✅ Error handling for failed payments  
✅ Comprehensive logging  

## 🚀 Next Phase

**Phase 3: Contractor Withdrawals**
- Stripe Connect integration
- Bank account verification
- Payout processing
- Transfer webhooks

---

**Need Help?** Check the full testing guide: `doc/payment/STRIPE_TESTING_GUIDE.md`

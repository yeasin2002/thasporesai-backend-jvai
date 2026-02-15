# Getting Started with Stripe Integration

## Quick Start Guide

This guide will get you up and running with the Stripe payment integration in under 30 minutes.

---

## Prerequisites

- [ ] Node.js and bun installed
- [ ] MongoDB running
- [ ] Stripe account created (https://stripe.com)
- [ ] Stripe CLI installed (optional but recommended)

---

## Step 1: Stripe Account Setup (5 minutes)

1. **Sign up for Stripe**: https://stripe.com
2. **Enable Test Mode**: Toggle "Test mode" in the top right of the dashboard
3. **Get your API keys**:
   - Go to Developers → API keys
   - Copy your **Secret key** (starts with `sk_test_`)

---

## Step 2: Environment Configuration (2 minutes)

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Get this in Step 3
```

---

## Step 3: Local Webhook Setup (5 minutes)

### Option A: Stripe CLI (Recommended)

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows: Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login**:
   ```bash
   stripe login
   ```

3. **Start webhook forwarding** (keep this running):
   ```bash
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```

4. **Copy the webhook secret** from the CLI output (starts with `whsec_`) and add it to `.env`

### Option B: Skip for Now

You can skip webhook setup initially and test without it. Webhooks are only needed for deposit confirmations.

---

## Step 4: Start Your Backend (1 minute)

```bash
# Install dependencies (if not already done)
bun install

# Start the server
bun dev
```

Your server should start on `http://localhost:4000`

---

## Step 5: Test the Integration (10 minutes)

### Test 1: Create a Deposit

1. **Get a JWT token** by logging in as a customer
2. **Create a deposit**:
   ```bash
   curl -X POST http://localhost:4000/api/wallet/deposit \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount": 100}'
   ```

3. **Open the Checkout URL** returned in the response in your browser

4. **Complete payment** with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

5. **Verify**:
   - Check Stripe CLI output for webhook event
   - Check wallet balance updated in database

### Test 2: Stripe Connect Onboarding

1. **Get a JWT token** by logging in as a contractor
2. **Start onboarding**:
   ```bash
   curl -X POST http://localhost:4000/api/wallet/stripe/onboard \
     -H "Authorization: Bearer CONTRACTOR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "refreshUrl": "http://localhost:3000/wallet",
       "returnUrl": "http://localhost:3000/wallet/success"
     }'
   ```

3. **Open the onboarding URL** in your browser

4. **Complete onboarding** with test data:
   - SSN: `000-00-0000`
   - Routing: `110000000`
   - Account: `000123456789`

5. **Check status**:
   ```bash
   curl -X GET http://localhost:4000/api/wallet/stripe/status \
     -H "Authorization: Bearer CONTRACTOR_JWT_TOKEN"
   ```

### Test 3: Full Payment Flow

1. **Customer deposits money** (Test 1)
2. **Customer sends offer** to contractor
3. **Contractor accepts offer** → Wallet balances update in DB
4. **Customer marks job complete** → Creates completion request
5. **Admin approves completion** → Stripe transfer to contractor
6. **Verify** contractor wallet balance and Stripe transfer

---

## Step 6: Explore the Documentation (5 minutes)

Now that you have the basics working, explore the full documentation:

1. **[Stripe Dashboard Setup](./STRIPE_DASHBOARD_SETUP.md)** - Complete configuration guide
2. **[Stripe CLI Quick Reference](./STRIPE_CLI_QUICK_REFERENCE.md)** - Command reference
3. **[Backend Implementation](./2.BACKEND_IMPLEMENTATION.md)** - Detailed implementation guide
4. **[Frontend API Guide](./3.FRONTEND_API_GUIDE.md)** - API reference for Flutter

---

## Common Issues

### Webhook Not Received

**Problem**: Payment completes but wallet balance doesn't update

**Solution**:
1. Check Stripe CLI is running: `stripe listen --forward-to localhost:4000/api/webhooks/stripe`
2. Verify webhook secret in `.env` matches CLI output
3. Check backend logs for webhook processing errors

### Payment Declined

**Problem**: Test payment fails

**Solution**:
1. Use correct test card: `4242 4242 4242 4242`
2. Ensure you're in test mode (check Stripe Dashboard)
3. Try a different test card from: https://stripe.com/docs/testing

### Connect Account Not Verified

**Problem**: Contractor can't receive payouts

**Solution**:
1. Complete full onboarding flow
2. Use test data: SSN `000-00-0000`, Routing `110000000`
3. Check status with GET `/api/wallet/stripe/status`

---

## Next Steps

### For Development

1. ✅ Test all payment flows locally
2. ✅ Review error handling
3. ✅ Test webhook failure scenarios
4. ✅ Implement frontend integration

### For Production

1. ⚠️ Complete Stripe account verification
2. ⚠️ Switch to live mode API keys
3. ⚠️ Configure production webhook endpoint
4. ⚠️ Test with real payments (small amounts)
5. ⚠️ Set up monitoring and alerts

---

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Customer can deposit money via Stripe Checkout
- [ ] Webhook updates wallet balance after deposit
- [ ] Customer can send offer (balance validation)
- [ ] Contractor can accept offer (DB wallet transfer)
- [ ] Customer can mark job complete
- [ ] Admin can approve completion (Stripe transfer)
- [ ] Contractor can request withdrawal
- [ ] Admin can approve withdrawal (Stripe transfer)
- [ ] Contractor can complete Stripe Connect onboarding
- [ ] Offer rejection refunds customer (DB only)
- [ ] Job cancellation refunds customer (DB only)
- [ ] Expired offers refund customer (cron job)

---

## Support Resources

### Documentation
- [Main Reference](./1.MAIN-REFERENCE.md) - Complete system overview
- [Backend Implementation](./2.BACKEND_IMPLEMENTATION.md) - Implementation guide
- [Frontend API Guide](./3.FRONTEND_API_GUIDE.md) - API reference

### Stripe Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Test Cards](https://stripe.com/docs/testing)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

### Need Help?
- Check backend logs for errors
- Review Stripe Dashboard → Developers → Webhooks for delivery logs
- Use `stripe logs tail` to monitor API calls
- Check database for wallet balance updates

---

## Summary

You've now:
- ✅ Set up Stripe account and API keys
- ✅ Configured local webhook forwarding
- ✅ Started your backend server
- ✅ Tested deposit flow with Stripe Checkout
- ✅ Tested Stripe Connect onboarding
- ✅ Verified payment integration works

**Time to complete**: ~30 minutes

**Next**: Explore the full documentation and implement frontend integration!

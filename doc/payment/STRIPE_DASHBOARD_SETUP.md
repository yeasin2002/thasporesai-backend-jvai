# Stripe Dashboard Configuration Guide

## Overview

This guide walks you through configuring your Stripe account for the JobSphere payment system. You'll set up webhooks, configure Stripe Connect, and test the integration.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to Stripe Dashboard
- Stripe CLI installed for local testing (optional but recommended)

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Webhook Configuration](#webhook-configuration)
3. [Stripe Connect Setup](#stripe-connect-setup)
4. [API Keys Configuration](#api-keys-configuration)
5. [Local Development Testing](#local-development-testing)
6. [Production Deployment](#production-deployment)
7. [Testing Checklist](#testing-checklist)

---

## Initial Setup

### 1. Create Stripe Account

1. Go to https://stripe.com and sign up
2. Complete account verification
3. Navigate to the Dashboard

### 2. Enable Test Mode

For development, always use **Test Mode**:

1. In the Stripe Dashboard, toggle the **"Test mode"** switch in the top right
2. All test data uses test API keys (starting with `sk_test_` and `pk_test_`)
3. Test mode data is completely separate from live data

---

## Webhook Configuration

Webhooks allow Stripe to notify your backend when payment events occur (e.g., successful checkout, failed payment).

### Development Environment

#### Option 1: Stripe CLI (Recommended)

The Stripe CLI forwards webhook events to your local server:

1. **Install Stripe CLI**:
   - macOS: `brew install stripe/stripe-cli/stripe`
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Linux: See https://stripe.com/docs/stripe-cli

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret**:
   - The CLI will display a webhook signing secret (starts with `whsec_`)
   - Add it to your `.env` file:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

5. **Keep the CLI running** while testing locally

#### Option 2: ngrok (Alternative)

If you can't use Stripe CLI, use ngrok to expose your local server:

1. Install ngrok: https://ngrok.com/download
2. Start your local server: `bun dev`
3. Expose it: `ngrok http 4000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Configure webhook in Stripe Dashboard (see Production setup below)
6. Use the webhook URL: `https://abc123.ngrok.io/api/webhooks/stripe`

### Production Environment

1. **Navigate to Webhooks**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click **"Add endpoint"**

2. **Configure Endpoint**:
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - **Description**: "JobSphere Payment Webhooks"
   - **API Version**: Use latest (or match your Stripe SDK version)

3. **Select Events to Listen**:
   Click **"Select events"** and choose:
   - `checkout.session.completed` ✅ (Required)
   - `checkout.session.async_payment_succeeded` ✅ (Required)
   - `checkout.session.async_payment_failed` ✅ (Required)

   Optional (for enhanced monitoring):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.failed`

4. **Save Endpoint**:
   - Click **"Add endpoint"**
   - Copy the **Signing secret** (starts with `whsec_`)
   - Add it to your production environment variables:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

### Webhook Event Handling

Your backend handles these events in `src/api/webhooks/services/handle-stripe-webhook.service.ts`:

- **`checkout.session.completed`**: Updates wallet balance after successful deposit
- **`checkout.session.async_payment_succeeded`**: Handles delayed payment success
- **`checkout.session.async_payment_failed`**: Handles payment failures

---

## Stripe Connect Setup

Stripe Connect allows contractors to receive payouts directly to their bank accounts.

### 1. Enable Stripe Connect

1. Go to Stripe Dashboard → **Connect** → **Settings**
2. Click **"Get started"** if not already enabled
3. Choose **"Platform or marketplace"** as your integration type

### 2. Configure Connect Settings

#### Branding

1. Navigate to **Connect** → **Settings** → **Branding**
2. Upload your logo and brand colors
3. This appears during contractor onboarding

#### Account Requirements

1. Go to **Connect** → **Settings** → **Account requirements**
2. Configure required information for connected accounts:
   - **Business type**: Individual or Company
   - **Required fields**: Bank account, identity verification
   - **Verification**: Enable identity verification

#### Payouts

1. Navigate to **Connect** → **Settings** → **Payouts**
2. Configure payout settings:
   - **Payout schedule**: Manual (admin-approved in JobSphere)
   - **Payout method**: Standard (bank transfer)

### 3. Platform Account Settings

1. Go to **Settings** → **Connect**
2. Configure:
   - **Platform name**: JobSphere
   - **Support email**: Your support email
   - **Platform URL**: Your website URL

### 4. Test Connected Accounts

In test mode, you can create test connected accounts:

1. Use the Stripe CLI or API to create test accounts
2. Test the onboarding flow
3. Verify payouts work correctly

---

## API Keys Configuration

### Development (Test Mode)

1. Go to Stripe Dashboard → **Developers** → **API keys**
2. Ensure **Test mode** is enabled (toggle in top right)
3. Copy your keys:
   - **Publishable key**: `pk_test_...` (for frontend, if needed)
   - **Secret key**: `sk_test_...` (for backend)

4. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Production (Live Mode)

1. Complete Stripe account activation:
   - Verify business information
   - Add bank account for payouts
   - Complete identity verification

2. Switch to **Live mode** (toggle in top right)

3. Go to **Developers** → **API keys**

4. Copy your **live** keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

5. Add to production environment variables:
   ```env
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

⚠️ **IMPORTANT**: Never commit API keys to version control!

---

## Local Development Testing

### Setup

1. **Install Stripe CLI** (if not already installed)
2. **Start your backend server**:
   ```bash
   bun dev
   ```

3. **Start Stripe webhook forwarding** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```

4. **Copy the webhook secret** from CLI output to `.env`

### Test Deposit Flow

1. **Create a deposit** via API:
   ```bash
   curl -X POST http://localhost:4000/api/wallet/deposit \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount": 100}'
   ```

2. **Open the Checkout URL** returned in the response

3. **Use test card numbers**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires authentication**: `4000 0025 0000 3155`
   - Any future expiry date (e.g., `12/34`)
   - Any 3-digit CVC (e.g., `123`)
   - Any billing ZIP code

4. **Complete the payment**

5. **Verify webhook received**:
   - Check Stripe CLI output for `checkout.session.completed` event
   - Check your backend logs
   - Verify wallet balance updated in database

### Test Stripe Connect Flow

1. **Create contractor account** and login

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

3. **Open the onboarding URL** returned in response

4. **Complete onboarding** with test data:
   - Use test SSN: `000-00-0000`
   - Use test routing number: `110000000`
   - Use test account number: `000123456789`

5. **Check account status**:
   ```bash
   curl -X GET http://localhost:4000/api/wallet/stripe/status \
     -H "Authorization: Bearer CONTRACTOR_JWT_TOKEN"
   ```

### Test Payout Flow

1. **Complete a job** (follow full job flow)
2. **Admin approves completion**
3. **Verify Stripe transfer** in Stripe Dashboard → **Connect** → **Transfers**
4. **Check contractor wallet** balance updated

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Stripe account fully verified
- [ ] Live mode API keys configured
- [ ] Webhook endpoint configured with HTTPS URL
- [ ] Webhook signing secret added to production environment
- [ ] Stripe Connect enabled and configured
- [ ] Platform branding configured
- [ ] Test all flows in test mode first

### Deployment Steps

1. **Switch to Live Mode** in Stripe Dashboard

2. **Update Environment Variables**:
   ```env
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

3. **Configure Production Webhook**:
   - Add webhook endpoint with your production URL
   - Select required events
   - Save signing secret

4. **Test in Production**:
   - Use real credit card (small amount)
   - Verify webhook delivery
   - Check wallet balance updates
   - Test full payment flow

5. **Monitor**:
   - Stripe Dashboard → **Developers** → **Webhooks** → View logs
   - Check webhook delivery success rate
   - Monitor failed payments

### Security Best Practices

1. **Always verify webhook signatures** (already implemented in code)
2. **Use HTTPS only** for webhook endpoints
3. **Rotate API keys** periodically
4. **Monitor for suspicious activity** in Stripe Dashboard
5. **Set up alerts** for failed webhooks
6. **Implement rate limiting** on payment endpoints
7. **Log all payment operations** for audit trail

---

## Testing Checklist

### Deposit Flow

- [ ] Create Checkout Session successfully
- [ ] Open Checkout URL in browser
- [ ] Complete payment with test card `4242 4242 4242 4242`
- [ ] Webhook `checkout.session.completed` received
- [ ] Wallet balance updated in database
- [ ] Transaction record created
- [ ] Test failed payment with card `4000 0000 0000 0002`
- [ ] Verify error handling

### Offer Flow

- [ ] Send offer with sufficient balance
- [ ] Verify balance validation (no deduction yet)
- [ ] Accept offer
- [ ] Verify DB wallet transfer (customer → admin)
- [ ] Verify job status updated to "assigned"
- [ ] Reject offer
- [ ] Verify DB refund (admin → customer)

### Completion Flow

- [ ] Customer marks job complete
- [ ] Completion request created with status "pending"
- [ ] Admin approves completion
- [ ] Verify DB wallet update (admin → contractor)
- [ ] Verify Stripe Connect transfer initiated
- [ ] Check transfer in Stripe Dashboard
- [ ] Verify job status updated to "completed"

### Withdrawal Flow

- [ ] Contractor requests withdrawal
- [ ] Withdrawal request created with status "pending"
- [ ] Admin approves withdrawal
- [ ] Verify DB wallet deduction
- [ ] Verify Stripe Connect transfer initiated
- [ ] Check transfer in Stripe Dashboard

### Stripe Connect Flow

- [ ] Contractor starts onboarding
- [ ] Complete onboarding with test data
- [ ] Verify account status returns "verified"
- [ ] Verify payouts enabled
- [ ] Test payout to connected account

### Cancellation Flow

- [ ] Cancel job with accepted offer
- [ ] Verify DB refund (admin → customer)
- [ ] Verify job status updated to "cancelled"

### Expiration Flow

- [ ] Create offer with past expiry date (or modify in DB)
- [ ] Wait for cron job to run (or trigger manually)
- [ ] Verify DB refund (admin → customer)
- [ ] Verify offer status updated to "expired"
- [ ] Verify notifications sent

---

## Troubleshooting

### Webhook Not Received

1. **Check webhook endpoint is accessible**:
   ```bash
   curl -X POST https://yourdomain.com/api/webhooks/stripe
   ```

2. **Verify webhook signing secret** matches in `.env`

3. **Check Stripe Dashboard** → Webhooks → View logs for delivery attempts

4. **Check backend logs** for webhook processing errors

5. **Verify HTTPS** is enabled (required for production)

### Payment Failed

1. **Check Stripe Dashboard** → Payments for error details
2. **Verify API keys** are correct and for the right mode (test/live)
3. **Check customer has sufficient funds** (for real cards)
4. **Review error logs** in backend

### Connect Account Issues

1. **Verify Connect is enabled** in Stripe Dashboard
2. **Check account verification status** in Connect → Accounts
3. **Review requirements** for connected account
4. **Check payout settings** are configured correctly

### Transfer Failed

1. **Check connected account status** (must be verified)
2. **Verify sufficient balance** in platform account
3. **Check transfer amount** meets minimum requirements
4. **Review Stripe Dashboard** → Connect → Transfers for error details

---

## Additional Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **Stripe Connect Guide**: https://stripe.com/docs/connect
- **Stripe Webhooks Guide**: https://stripe.com/docs/webhooks
- **Stripe CLI Documentation**: https://stripe.com/docs/stripe-cli
- **Test Cards**: https://stripe.com/docs/testing

---

## Support

For Stripe-specific issues:
- Stripe Support: https://support.stripe.com
- Stripe Community: https://stripe.com/community

For JobSphere integration issues:
- Check backend logs
- Review `doc/payment/` documentation
- Contact development team

---

## Summary

You've now configured:
- ✅ Webhook endpoint for payment notifications
- ✅ Stripe Connect for contractor payouts
- ✅ API keys for development and production
- ✅ Local testing with Stripe CLI
- ✅ Production deployment checklist

Next steps:
1. Test all flows in test mode
2. Deploy to production
3. Monitor webhook delivery
4. Test with real payments (small amounts)
5. Set up monitoring and alerts

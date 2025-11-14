# Stripe Dashboard Setup Guide

**Quick Reference for JobSphere Payment System**

---

## Table of Contents

1. [Initial Account Setup](#initial-account-setup)
2. [API Keys Configuration](#api-keys-configuration)
3. [Webhook Configuration](#webhook-configuration)
4. [Stripe Connect Setup](#stripe-connect-setup)
5. [Payment Methods](#payment-methods)
6. [Testing Configuration](#testing-configuration)
7. [Production Activation](#production-activation)

---

## Initial Account Setup

### Step 1: Create Stripe Account

1. Go to [stripe.com/register](https://stripe.com/register)
2. Enter business email
3. Create password
4. Verify email address

### Step 2: Complete Business Profile

1. Navigate to \*\*Settis** → **Business settings\*\*
2. Fill in:
   - **Business name**: JobSphere
   - **Business type**: Marketplace/Platform
   - **Industry**: Service Marketplace
   - **Website**: https://jobsphere.com
   - **Support email**: support@jobsphere.com
   - **Support phone**: Your phone number

### Step 3: Verify Business

1. Go to **Settings** → **Business settings** → **Verification**
2. Provide:
   - Business registration documents
   - Tax ID (EIN for US)
   - Bank account details
   - Personal identification

**Note**: Verification can take 1-3 business days

---

## API Keys Configuration

### Test Mode Keys (Development)

1. Toggle **Test mode** ON (top right corner)
2. Go to **Developers** → **API keys**
3. Copy keys:

```env
# Test Keys
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
```

**Security**:

- ✅ Test keys are safe to use in development
- ✅ Can be committed to private repos
- ❌ Never use in production

### Live Mode Keys (Production)

1. Toggle **Test mode** OFF
2. Go to **Developers** → **API keys**
3. Copy keys:

```env
# Live Keys
STRIPE_PUBLISHABLE_KEY=pk_live_51...
STRIPE_SECRET_KEY=sk_live_51...
```

**Security**:

- ❌ Never commit to version control
- ❌ Never expose in client-side code
- ✅ Store in environment variables only
- ✅ Rotate keys if compromised

### Restricted API Keys (Optional)

For enhanced security, create restricted keys:

1. Go to **Developers** → **API keys**
2. Click **Create restricted key**
3. Name: `JobSphere Backend`
4. Select permissions:
   - ✅ Write: Charges
   - ✅ Write: Customers
   - ✅ Write: Payment Intents
   - ✅ Write: Refunds
   - ✅ Write: Transfers
   - ✅ Read: All resources
5. Click **Create key**

---

## Webhook Configuration

### Step 1: Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**

### Step 2: Configure Endpoint URL

**Development**:

```
http://localhost:4000/api/webhooks/stripe
```

**Staging**:

```
https://staging-api.jobsphere.com/api/webhooks/stripe
```

**Production**:

```
https://api.jobsphere.com/api/webhooks/stripe
```

### Step 3: Select Events

Click **Select events** and choose:

#### Payment Events

- [x] `payment_intent.succeeded`
- [x] `payment_intent.payment_failed`
- [x] `payment_intent.canceled`
- [x] `payment_intent.created`

#### Transfer Events

- [x] `transfer.created`
- [x] `transfer.paid`
- [x] `transfer.failed`
- [x] `transfer.reversed`

#### Refund Events

- [x] `charge.refunded`
- [x] `charge.refund.updated`

#### Connect Events

- [x] `account.updated`
- [x] `account.application.authorized`
- [x] `account.application.deauthorized`

#### Dispute Events (Optional)

- [x] `charge.dispute.created`
- [x] `charge.dispute.closed`
- [x] `charge.dispute.updated`

### Step 4: Get Signing Secret

1. Click on the webhook endpoint
2. Find **Signing secret** section
3. Click **Reveal**
4. Copy the secret (starts with `whsec_`)

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 5: Test Webhook

1. Click **Send test webhook**
2. Select event: `payment_intent.succeeded`
3. Click **Send test webhook**
4. Verify response: `200 OK`

---

## Stripe Connect Setup

### Step 1: Enable Connect

1. Go to **Connect** → **Settings**
2. Click **Get started**
3. Select platform type: **Standard**

### Step 2: Configure Branding

1. Go to **Connect** → **Settings** → **Branding**
2. Upload:
   - **Logo**: JobSphere logo (square, 128x128px minimum)
   - **Icon**: JobSphere icon (square, 32x32px minimum)
   - **Brand color**: Your primary color (e.g., #4F46E5)

### Step 3: Configure OAuth

1. Go to **Connect** → **Settings** → **Integration**
2. Set redirect URIs:

**Development**:

```
http://localhost:3000/contractor/stripe/callback
```

**Production**:

```
https://jobsphere.com/contractor/stripe/callback
```

3. Copy **Client ID**:

```env
STRIPE_CONNECT_CLIENT_ID=ca_...
```

### Step 4: Configure Payouts

1. Go to **Connect** → **Settings** → **Payouts**
2. Set payout schedule:
   - **Frequency**: Daily
   - **Delay**: 2 days (standard)
3. Enable **Instant Payouts** (optional, requires approval)

---

## Payment Methods

### Step 1: Enable Payment Methods

1. Go to **Settings** → **Payment methods**
2. Enable:
   - [x] **Cards** (Visa, Mastercard, Amex, Discover)
   - [x] **Digital wallets** (Apple Pay, Google Pay)
   - [ ] **Bank debits** (ACH - optional)
   - [ ] **Buy now, pay later** (Klarna, Afterpay - optional)

### Step 2: Configure Card Settings

1. Go to **Settings** → **Payment methods** → **Cards**
2. Enable:
   - [x] **3D Secure** (recommended for fraud prevention)
   - [x] **Decline on CVC failure**
   - [x] **Decline on postal code failure**

### Step 3: Set Currency

1. Go to **Settings** → **Business settings**
2. Set **Default currency**: USD
3. Enable additional currencies if needed

---

## Testing Configuration

### Test Cards

Use these cards in test mode:

**Successful Payments**:

```
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Declined Payments**:

```
Card: 4000 0000 0000 0002
Reason: Generic decline
```

**Insufficient Funds**:

```
Card: 4000 0000 0000 9995
Reason: Insufficient funds
```

**3D Secure Required**:

```
Card: 4000 0027 6000 3184
Requires: 3D Secure authentication
```

**More test cards**: [stripe.com/docs/testing](https://stripe.com/docs/testing)

### Test Mode Features

In test mode you can:

- ✅ Create test payments
- ✅ Trigger webhooks manually
- ✅ Test refunds
- ✅ Test disputes
- ✅ Test Connect onboarding
- ✅ View detailed logs

**Note**: Test mode data is separate from live mode

---

## Production Activation

### Pre-Activation Checklist

- [ ] Business verification completed
- [ ] Bank account added and verified
- [ ] Tax information submitted
- [ ] Payment methods configured
- [ ] Webhooks tested in test mode
- [ ] Connect settings configured
- [ ] Terms of service accepted

### Step 1: Activate Live Mode

1. Complete all verification steps
2. Toggle **Test mode** OFF
3. Verify all settings are correct

### Step 2: Update Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Create new endpoint for production URL
3. Select same events as test mode
4. Copy new webhook secret

### Step 3: Update Environment Variables

```env
# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

### Step 4: Test with Small Transaction

1. Make a small real payment ($1)
2. Verify webhook received
3. Check transaction in dashboard
4. Test refund
5. Verify all flows work correctly

---

## Dashboard Navigation

### Key Sections

**Home**

- Overview of recent activity
- Quick stats (revenue, customers, etc.)

**Payments**

- View all payments
- Filter by status, date, amount
- Export transaction data

**Customers**

- View customer list
- Customer payment history
- Manage customer data

**Connect**

- View connected accounts (contractors)
- Monitor account status
- Manage payouts

**Developers**

- API keys
- Webhooks
- Logs
- API requests

**Settings**

- Business settings
- Payment methods
- Team members
- Billing

---

## Monitoring & Alerts

### Set Up Email Alerts

1. Go to **Settings** → **Notifications**
2. Enable alerts for:
   - [x] Failed payments
   - [x] Disputes
   - [x] Webhook failures
   - [x] Unusual activity
   - [x] Payout failures

### View Logs

**API Logs**:

1. Go to **Developers** → **Logs**
2. Filter by:
   - Request type
   - Status code
   - Date range

**Webhook Logs**:

1. Go to **Developers** → **Webhooks**
2. Click on endpoint
3. View **Attempts** tab

---

## Security Settings

### Enable Two-Factor Authentication

1. Go to **Settings** → **Team and security**
2. Click **Enable two-factor authentication**
3. Scan QR code with authenticator app
4. Save backup codes

### Restrict IP Addresses (Optional)

1. Go to **Settings** → **Team and security**
2. Click **IP address restrictions**
3. Add allowed IP addresses
4. Save changes

### Audit Logs

1. Go to **Settings** → **Team and security**
2. Click **Audit log**
3. Review all account activities

---

## Common Tasks

### View Transaction Details

1. Go to **Payments**
2. Click on transaction
3. View:
   - Payment details
   - Customer info
   - Timeline
   - Metadata
   - Logs

### Issue Refund

1. Go to **Payments**
2. Find transaction
3. Click **Refund**
4. Enter amount
5. Select reason
6. Click **Refund**

### View Payout Schedule

1. Go to **Balance** → **Payouts**
2. View:
   - Pending payouts
   - Paid payouts
   - Payout schedule

### Export Data

1. Go to **Payments** or **Customers**
2. Click **Export**
3. Select:
   - Date range
   - Format (CSV, Excel)
   - Columns to include
4. Click **Export**

---

## Troubleshooting

### Can't Find API Keys

**Solution**:

1. Ensure you're in correct mode (Test/Live)
2. Go to **Developers** → **API keys**
3. Keys are at top of page

### Webhook Not Working

**Solution**:

1. Check endpoint URL is correct
2. Verify webhook secret in `.env`
3. Check **Developers** → **Webhooks** → **Attempts**
4. Look for error messages

### Payment Declined

**Solution**:

1. Check card details are correct
2. Verify sufficient funds
3. Check if 3D Secure required
4. View decline reason in dashboard

### Connect Account Not Activating

**Solution**:

1. Check **Connect** → **Accounts**
2. Click on account
3. View **Requirements** tab
4. Complete missing information

---

## Support Resources

### Stripe Documentation

- [Stripe Docs](https://stripe.com/docs)
- [API Reference](https://stripe.com/docs/api)
- [Connect Guide](https://stripe.com/docs/connect)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

### Stripe Support

- **Email**: support@stripe.com
- **Chat**: Available in dashboard (bottom right)
- **Phone**: Available for verified accounts

### Community

- [Stripe Community](https://community.stripe.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stripe-payments)

---

## Quick Reference

### Essential URLs

```
Dashboard: https://dashboard.stripe.com
API Keys: https://dashboard.stripe.com/apikeys
Webhooks: https://dashboard.stripe.com/webhooks
Connect: https://dashboard.stripe.com/connect
Logs: https://dashboard.stripe.com/logs
```

### Essential Commands

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

### Essential Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

---

## Checklist

### Initial Setup

- [ ] Create Stripe account
- [ ] Complete business profile
- [ ] Add bank account
- [ ] Get API keys
- [ ] Configure webhooks
- [ ] Enable Connect
- [ ] Test in test mode

### Before Production

- [ ] Complete verification
- [ ] Switch to live keys
- [ ] Update webhook URL
- [ ] Test with real payment
- [ ] Enable monitoring
- [ ] Set up alerts
- [ ] Train support team

---

**Last Updated**: November 14, 2025  
**Version**: 1.0.0

For the latest information, always refer to [Stripe Dashboard](https://dashboard.stripe.com) and [Stripe Documentation](https://stripe.com/docs).
ng

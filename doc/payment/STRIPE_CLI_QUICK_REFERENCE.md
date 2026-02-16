# Stripe CLI Quick Reference

## Installation

### macOS

```bash
brew install stripe/stripe-cli/stripe
```

### Windows

Download from: https://github.com/stripe/stripe-cli/releases

### Linux

```bash
# Debian/Ubuntu
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin/
```

## Authentication

### Login

```bash
stripe login
```

Opens browser for authentication. Saves credentials locally.

### Check Login Status

```bash
stripe config --list
```

## Webhook Testing

### Forward Webhooks to Local Server

```bash
# Default (port 4000)
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# Custom port
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# With specific events only
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:4000/api/webhooks/stripe
```

### Trigger Test Webhooks

```bash
# Trigger checkout.session.completed
stripe trigger checkout.session.completed

# Trigger payment_intent.succeeded
stripe trigger payment_intent.succeeded

# Trigger with custom data
stripe trigger checkout.session.completed --override checkout_session:metadata.userId=user123
```

## Testing Payments

### Create Test Checkout Session

```bash
stripe checkout sessions create \
  --mode payment \
  --line-items '[{"price_data": {"currency": "usd", "product_data": {"name": "Test"}, "unit_amount": 1000}, "quantity": 1}]' \
  --success-url "http://localhost:3000/success" \
  --cancel-url "http://localhost:3000/cancel"
```

### List Recent Checkout Sessions

```bash
stripe checkout sessions list --limit 10
```

### Retrieve Checkout Session

```bash
stripe checkout sessions retrieve cs_test_xxxxxxxxxxxxx
```

## Stripe Connect Testing

### Create Test Connected Account

```bash
stripe accounts create \
  --type express \
  --country US \
  --email contractor@example.com \
  --capabilities[card_payments][requested]=true \
  --capabilities[transfers][requested]=true
```

### List Connected Accounts

```bash
stripe accounts list --limit 10
```

### Retrieve Account Details

```bash
stripe accounts retrieve acct_xxxxxxxxxxxxx
```

### Create Account Link (Onboarding)

```bash
stripe account_links create \
  --account acct_xxxxxxxxxxxxx \
  --refresh_url "http://localhost:3000/reauth" \
  --return_url "http://localhost:3000/return" \
  --type account_onboarding
```

### Create Test Transfer

```bash
stripe transfers create \
  --amount 1000 \
  --currency usd \
  --destination acct_xxxxxxxxxxxxx \
  --description "Test payout"
```

## Monitoring & Debugging

### View Webhook Events

```bash
# List recent events
stripe events list --limit 10

# Filter by type
stripe events list --type checkout.session.completed

# Retrieve specific event
stripe events retrieve evt_xxxxxxxxxxxxx
```

### View Logs

```bash
# Real-time logs
stripe logs tail

# Filter by HTTP method
stripe logs tail --filter-http-method POST

# Filter by status code
stripe logs tail --filter-status-code 200
```

### Test Webhook Endpoint

```bash
# Send test event to your endpoint
stripe trigger checkout.session.completed --forward-to localhost:4000/api/webhooks/stripe
```

## API Key Management

### List API Keys

```bash
stripe config --list
```

### Switch Between Test/Live Mode

```bash
# Use test mode (default)
stripe --api-key sk_test_xxxxxxxxxxxxx

# Use live mode
stripe --api-key sk_live_xxxxxxxxxxxxx
```

## Common Workflows

### Local Development Setup

```bash
# Terminal 1: Start your backend
bun dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# Copy the webhook signing secret (whsec_...) to your .env file
```

### Test Complete Payment Flow

```bash
# 1. Create checkout session (via your API)
curl -X POST http://localhost:4000/api/wallet/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'

# 2. Open the returned URL in browser
# 3. Use test card: 4242 4242 4242 4242
# 4. Watch webhook in Stripe CLI terminal
# 5. Verify wallet balance updated
```

### Test Stripe Connect Flow

```bash
# 1. Create connected account (via your API)
curl -X POST http://localhost:4000/api/wallet/stripe/onboard \
  -H "Authorization: Bearer CONTRACTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshUrl": "http://localhost:3000/wallet", "returnUrl": "http://localhost:3000/wallet/success"}'

# 2. Open onboarding URL
# 3. Complete with test data
# 4. Check status
curl -X GET http://localhost:4000/api/wallet/stripe/status \
  -H "Authorization: Bearer CONTRACTOR_TOKEN"
```

## Test Cards

### Successful Payments

```
4242 4242 4242 4242  # Visa
5555 5555 5555 4444  # Mastercard
3782 822463 10005    # American Express
```

### Failed Payments

```
4000 0000 0000 0002  # Card declined
4000 0000 0000 9995  # Insufficient funds
4000 0000 0000 0069  # Expired card
```

### 3D Secure Authentication

```
4000 0025 0000 3155  # Requires authentication
4000 0027 6000 3184  # Authentication fails
```

### Additional Test Data

- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## Troubleshooting

### Webhook Not Received

```bash
# Check if endpoint is reachable
curl -X POST http://localhost:4000/api/webhooks/stripe

# View webhook delivery attempts
stripe events list --type checkout.session.completed

# Resend webhook
stripe events resend evt_xxxxxxxxxxxxx
```

### View Error Details

```bash
# Get detailed error information
stripe logs tail --filter-status-code 400,500

# View specific event
stripe events retrieve evt_xxxxxxxxxxxxx
```

### Test Webhook Signature Verification

```bash
# Trigger event and watch for signature verification
stripe trigger checkout.session.completed --forward-to localhost:4000/api/webhooks/stripe
```

## Useful Flags

- `--api-key`: Use specific API key
- `--limit`: Limit number of results
- `--starting-after`: Pagination cursor
- `--created`: Filter by creation date
- `--type`: Filter by event type
- `--format`: Output format (json, yaml)

## Examples

### Get Recent Payments

```bash
stripe payment_intents list --limit 5
```

### Search for Customer

```bash
stripe customers list --email customer@example.com
```

### View Balance

```bash
stripe balance retrieve
```

### List Transfers

```bash
stripe transfers list --limit 10
```

## Resources

- **CLI Documentation**: https://stripe.com/docs/stripe-cli
- **API Reference**: https://stripe.com/docs/api
- **Test Cards**: https://stripe.com/docs/testing
- **Webhooks Guide**: https://stripe.com/docs/webhooks

## Quick Tips

1. **Always use test mode** during development
2. **Keep webhook listener running** while testing
3. **Check webhook signing secret** matches in .env
4. **Use test cards** for all test payments
5. **Monitor logs** with `stripe logs tail`
6. **Trigger events** with `stripe trigger` for testing
7. **View events** with `stripe events list`
8. **Test locally** before deploying to production

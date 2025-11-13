# Payment & Bidding System Documentation

## Overview

JobSphere's payment and bidding system enables customers to hire contractors through a secure, commission-based platform using Stripe for payment processing.

## Documentation Structure

This directory contains comprehensive documentation for the payment and bidding system:

## Key Changes from Original Plan

### ✅ What Changed

1. **No Separate Bidding Module** - Uses existing `job-request` module
2. **Simplified Commission** - Buyer pays 5% extra, Seller gets 80% (Admin gets 25% total)
3. **One Offer Per Job** - Cannot send multiple offers for same job
4. **Wallet-Based** - Money must be in wallet before sending offer
5. **Escrow System** - Money held in escrow until job completion

### 📊 Commission Structure

```
Job Budget: $100
├── Buyer Pays: $105 (100 + 5%)
├── Seller Gets: $80 (100 - 20%)
└── Admin Gets: $25 (5% + 20%)
```

## Quick Start

### System Flow Summary

1. **Customer posts job** → Job Status: `open`
2. **Contractor sends application** → Application created
3. **Customer reviews applications** → Chats with contractors
4. **Customer sends offer** → Offer Status: `pending`
5. **Contractor accepts offer** → Payment initiated, Job Status: `assigned`
6. **Contractor completes work** → Customer marks complete
7. **Admin releases payment** → Fees deducted, Job Status: `completed`

### Commission Structure (Revised)

- **Platform Fee**: 5% (charged to buyer when offer sent)
- **Service Fee**: 20% (deducted from seller when job completed)
- **Total Admin Commission**: 25% of job budget
- **Contractor Payout**: 80% of job budget

### Key Modules

- **Job Module** (`/api/job`) - Job posting and management ✅ Existing
- **Job Request Module** (`/api/job-request`) - Application handling + **Offer management** ✅ Extend existing
- **Chat Module** (`/api/chat`) - Customer-contractor communication ✅ Existing
- **Wallet Module** (`/api/wallet`) - Balance and transactions ⚠️ **NEW** - Need to create
- **Offer Model** (`/api/offer`) - Offer management ⚠️ **NEW** - Need to create
- **Payment Module** - Not needed (wallet-based system with stripe)

## Implementation Checklist

### Database Models Required

- [x] Job Model (existing - needs updates)
- [x] JobApplicationRequest Model (existing)
- [ ] Offer Model (new)
- [ ] Payment Model (new)
- [ ] Transaction Model (new)
- [ ] Wallet Model (new)

### API Modules Required

- [x] Job API (existing)
- [x] Job Request API (existing)
- [x] Chat API (existing)
- [ ] Bidding API (needs implementation)
- [ ] Payment API (needs implementation)
- [ ] Wallet API (needs implementation)

### Stripe Integration

- [ ] Stripe account setup
- [ ] Payment intent creation
- [ ] Payment hold/capture
- [ ] Stripe Connect for contractor payouts
- [ ] Webhook handling
- [ ] Commission calculation

### Features to Implement

- [ ] Offer creation and management
- [ ] Offer acceptance/rejection
- [ ] Payment processing
- [ ] Wallet system
- [ ] Transaction history
- [ ] Admin commission tracking
- [ ] Payment release mechanism
- [ ] Refund handling

## Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Commission Rates (percentage)
PLATFORM_FEE_PERCENT=10
SERVICE_FEE_PERCENT=20

# Payment Settings
PAYMENT_CURRENCY=USD
PAYMENT_HOLD_DAYS=7
```

## Dependencies

```json
{
  "stripe": "^14.x",
  "decimal.js": "^10.x"
}
```

## Getting Started

### ⚡ Quick Start (5 minutes)

1. **[REVISED_FLOW.md](./REVISED_FLOW.md)** - ⭐ **START HERE** - Your actual system flow (no separate bidding module)
2. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - 📋 **STEP-BY-STEP** - Complete implementation guide (12 days)
3. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 🔍 Quick reference for key concepts

### 📚 Detailed Documentation

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview
2. **[FLOW.md](./FLOW.md)** - Original flow (with separate bidding module - for reference only)
3. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database models and relationships
4. **[API_DESIGN.md](./API_DESIGN.md)** - API endpoints specifications
5. **[JOB_LIFECYCLE.md](./JOB_LIFECYCLE.md)** - Job status management
6. **[STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)** - Stripe payment processing (future)
7. **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Original checklist (for reference)

### 🤖 AI Assistant Integration

- **Kiro Steering Doc**: `.kiro/steering/payment-bidding-system.md` - AI assistant guidance
- **Existing Patterns**: Check `src/api/job/`, `src/api/job-request/`, `src/api/chat/` for code patterns
- **Module Generator**: `bun run generate:module --module <name>` for scaffolding

## Support

For questions or issues:
- Review documentation in this directory
- Check existing modules for patterns
- Refer to Stripe documentation for payment details

---

**Last Updated**: November 2025
**Version**: 1.0.0

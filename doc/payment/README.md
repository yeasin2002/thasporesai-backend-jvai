# Payment & Bidding System Documentation

## Overview

JobSphere's payment and bidding system enables customers to hire contractors through a secure, commission-based platform using Stripe for payment processing.

## Documentation Structure

This directory contains comprehensive documentation for the payment and bidding system:

### Core Documentation

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - ⚡ **START HERE** - Quick reference for key concepts
2. **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - ⭐ **IMPORTANT** - How to integrate with existing codebase
3. **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Step-by-step implementation guide
4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and component overview
5. **[FLOW.md](./FLOW.md)** - Complete workflow from job posting to payment release
6. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database models and relationships
7. **[API_DESIGN.md](./API_DESIGN.md)** - API endpoints and specifications
8. **[STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)** - Stripe payment processing details
9. **[JOB_LIFECYCLE.md](./JOB_LIFECYCLE.md)** - Job status management and transitions

## Quick Start

### System Flow Summary

1. **Customer posts job** → Job Status: `open`
2. **Contractor sends application** → Application created
3. **Customer reviews applications** → Chats with contractors
4. **Customer sends offer** → Offer Status: `pending`
5. **Contractor accepts offer** → Payment initiated, Job Status: `assigned`
6. **Contractor completes work** → Customer marks complete
7. **Admin releases payment** → Fees deducted, Job Status: `completed`

### Commission Structure

- **Platform Fee**: 10% (deducted when offer accepted)
- **Service Fee**: 20% (deducted when job completed)
- **Total Admin Commission**: 30% of offer amount

### Key Modules

- **Job Module** (`/api/job`) - Job posting and management
- **Job Request Module** (`/api/job-request`) - Application handling
- **Chat Module** (`/api/chat`) - Customer-contractor communication
- **Bidding Module** (`/api/bidding`) - Offer management
- **Payment Module** (`/api/payment`) - Stripe integration and transactions

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

### For Quick Understanding

1. **Start here**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Get up to speed in 5 minutes
2. Review [FLOW.md](./FLOW.md) for complete workflow visualization
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview

### For Implementation

1. **Essential**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Shows how to integrate with your existing codebase patterns
2. Follow [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for step-by-step guide
3. Reference [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for model definitions
4. Implement APIs following [API_DESIGN.md](./API_DESIGN.md)
5. Integrate Stripe using [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)
6. Manage job states with [JOB_LIFECYCLE.md](./JOB_LIFECYCLE.md)

### AI Assistant Integration

- **Kiro Steering Doc**: `.kiro/steering/payment-bidding-system.md` - Complete guidance for AI assistant
- **Existing Patterns**: Check `src/api/job/`, `src/api/auth/` for established code patterns
- **Module Generator**: `bun run generate:module --module <name>` for scaffolding new modules

## Support

For questions or issues:
- Review documentation in this directory
- Check existing modules for patterns
- Refer to Stripe documentation for payment details

---

**Last Updated**: November 2025
**Version**: 1.0.0

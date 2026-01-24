# JobSphere Payment System Documentation

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Status**: Production Ready

---

## Documentation Structure

This documentation has been consolidated and reorganized for clarity. Each document has a specific purpose with no duplication.

### Core Documents

1. **[1. System Overview](./1.SYSTEM_OVERVIEW.md)**
   - High-level architecture and business logic
   - Commission structure and money flow
   - Payment lifecycle and state transitions
   - For: Product managers, developers, stakeholders

2. **[2. Backend Implementation](./2.BACKEND_IMPLEMENTATION.md)**
   - Database models and schemas
   - Service layer implementation
   - Transaction management
   - Error handling patterns
   - For: Backend developers

3. **[3. Frontend API Guide](./3.FRONTEND_API_GUIDE.md)**
   - Complete API endpoint reference
   - Request/response examples
   - Code examples (React, Flutter)
   - UI component patterns
   - For: Frontend and mobile developers

4. **[4. Stripe Integration](./4.STRIPE_INTEGRATION.md)** *(Future)*
   - Stripe setup and configuration
   - Payment Intent implementation
   - Stripe Connect for payouts
   - Webhook integration
   - For: Backend developers implementing Stripe

5. **[5. Testing Guide](./5.TESTING_GUIDE.md)** *(Future)*
   - Test scenarios and flows
   - Test data and accounts
   - Integration testing
   - For: QA engineers and developers

6. **[6. Production Deployment](./6.PRODUCTION_DEPLOYMENT.md)** *(Future)*
   - Deployment checklist
   - Monitoring and alerts
   - Security considerations
   - For: DevOps and backend developers

---

## Quick Start

### For Backend Developers
1. Read [System Overview](./1.SYSTEM_OVERVIEW.md) to understand the business logic
2. Follow [Backend Implementation](./2.BACKEND_IMPLEMENTATION.md) to implement features
3. Reference [Stripe Integration](./4.STRIPE_INTEGRATION.md) when ready for real payments

### For Frontend Developers
1. Read [System Overview](./1.SYSTEM_OVERVIEW.md) for context
2. Use [Frontend API Guide](./3.FRONTEND_API_GUIDE.md) as your primary reference
3. Copy code examples and adapt to your framework

### For Product/Business
1. Read [System Overview](./1.SYSTEM_OVERVIEW.md) for complete understanding
2. Reference commission structure and payment flows
3. Use for stakeholder communication

---

## System Summary

### Commission Structure
```
$100 Job Example:
├── Customer Pays: $105 (100 + 5% platform fee)
├── Platform Fee: $5 → Admin (when offer accepted)
├── Service Fee: $20 → Admin (when job completed)
└── Contractor Gets: $80 (when job completed)

Total Admin Commission: $25 (25%)
```

### Payment Flow
```
1. Customer deposits money → Wallet
2. Customer sends offer → Escrow ($105 deducted)
3. Contractor accepts → Platform fee $5 to admin
4. Contractor works → Status: "in_progress"
5. Customer completes → Service fee $20 to admin, $80 to contractor
```

### Current Status
- ✅ Wallet system (manual deposits/withdrawals)
- ✅ Escrow-based offer system
- ✅ Commission calculation and distribution
- ✅ Transaction audit trail
- ✅ Refund handling
- ❌ Stripe integration (pending)
- ❌ Real payment processing (pending)

---

## API Endpoints

### Wallet
- `GET /api/wallet` - Get balance
- `POST /api/wallet/deposit` - Add money
- `POST /api/wallet/withdraw` - Withdraw money (contractors)
- `GET /api/wallet/transactions` - Transaction history

### Offers
- `POST /api/job-request/:applicationId/send-offer` - Send offer
- `POST /api/job-request/offer/:offerId/accept` - Accept offer
- `POST /api/job-request/offer/:offerId/reject` - Reject offer

### Jobs
- `PATCH /api/job/:id/status` - Update status
- `POST /api/job/:id/complete` - Mark complete
- `POST /api/job/:id/cancel` - Cancel job

---

## Database Models

### Core Models
- **Wallet**: User balance and escrow tracking
- **Offer**: Job offers with payment details
- **Transaction**: Complete audit trail
- **Job**: Updated with payment fields
- **JobApplicationRequest**: Updated with offer reference

### Key Relationships
```
User → Wallet (1:1)
Job → Offer (1:1)
Offer → Transaction (1:many)
User → Transaction (1:many as sender/receiver)
```

---

## Technology Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: MongoDB with Mongoose
- **Validation**: Zod schemas
- **Documentation**: OpenAPI 3.0
- **Future**: Stripe for payments

---

## Development

### Local Setup
```bash
# Install dependencies
pnpm install

# Start development server
bun dev

# View API documentation
open http://localhost:4000/api-docs
```

### Testing
```bash
# Run tests (when implemented)
bun test

# Test specific flow
bun test:payment
```

---

## Support

### Documentation Issues
If you find errors or need clarification:
1. Check the specific document for your role
2. Review code examples in Frontend API Guide
3. Consult the System Overview for business logic

### Implementation Questions
- Backend: See Backend Implementation Guide
- Frontend: See Frontend API Guide
- Stripe: See Stripe Integration Guide (when ready)

---

## Changelog

### Version 1.0.0 (January 24, 2026)
- Consolidated documentation from 25+ files to 6 core documents
- Removed duplication across MONEY/, IMPLEMENTATION/, WEBHOOK.md/ folders
- Added numbered indexing for better organization
- Created role-specific documentation
- Added comprehensive code examples
- Improved structure and clarity

---

## Next Steps

1. **Immediate**: Use current wallet system for development
2. **Phase 1**: Implement Stripe Payment Intents for deposits
3. **Phase 2**: Implement Stripe Connect for contractor payouts
4. **Phase 3**: Add webhook handling for payment confirmation
5. **Phase 4**: Production deployment with monitoring

---

**For the most up-to-date information, always refer to the numbered documents above.**


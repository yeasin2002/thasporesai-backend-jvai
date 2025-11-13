# Design Document - OpenAPI Documentation Update

## Overview

This design outlines the approach to ensure complete and accurate OpenAPI documentation for the JobSphere payment system. The solution focuses on updating existing documentation, removing unused modules, and establishing consistent patterns across all payment-related endpoints.

## Architecture

### Current State Analysis

```
src/api/
├── wallet/                    ✅ Has OpenAPI (needs review)
│   ├── wallet.route.ts
│   ├── wallet.openapi.ts
│   ├── wallet.validation.ts
│   └── services/
│   └── services/
├── job-request/               ⚠️ Has offer endpoints (needs OpenAPI update)
│   ├── job-request.route.ts
│   ├── job-request.openapi.ts
│   ├── job-request.validation.ts
│   └── services/
│       ├── send-offer.service.ts
│       ├── accept-offer.service.ts
│       └── reject-offer.service.ts
└── job/                       ⚠️ Has payment endpoints (needs OpenAPI update)
    ├── job.route.ts
    ├── job.openapi.ts
    └── services/
        ├── complete-job.service.ts
        └── cancel-job.service.ts
```

### Target State

```
src/api/
├── wallet/                    ✅ Complete OpenAPI documentation
│   ├── wallet.route.ts
│   ├── wallet.openapi.ts      [UPDATED]
│   ├── wallet.validation.ts
│   └── services/
├── job-request/               ✅ Complete OpenAPI with offer endpoints
│   ├── job-request.route.ts
│   ├── job-request.openapi.ts [UPDATED]
│   ├── job-request.validation.ts
│   └── services/
└── job/                       ✅ Complete OpenAPI with payment endpoints
    ├── job.route.ts
    ├── job.openapi.ts         [UPDATED]
    └── services/

```

## Components and Interfaces

### 1. Wallet Module OpenAPI

**File**: `src/api/wallet/wallet.openapi.ts`

**Endpoints to Document**:

1. `GET /api/wallet` - Get wallet balance
2. `POST /api/wallet/deposit` - Deposit money
3. `POST /api/wallet/withdraw` - Withdraw money (contractors only)
4. `GET /api/wallet/transactions` - Get transaction history

**Schema Definitions**:

```typescript
// Response schemas
WalletSchema {
  _id: string
  user: string
  balance: number
  escrowBalance: number
  currency: string
  isActive: boolean
  isFrozen: boolean
  totalEarnings: number
  totalSpent: number
  totalWithdrawals: number
  createdAt: string
  updatedAt: string
}

TransactionSchema {
  _id: string
  type: enum[8 types]
  amount: number
  from: UserObject
  to: UserObject
  status: enum[pending, completed, failed]
  description: string
  createdAt: string
  updatedAt: string
}

// Request schemas (from wallet.validation.ts)
DepositSchema {
  amount: number (positive)
  paymentMethodId: string (min 1)
}

WithdrawSchema {
  amount: number (positive)
}

TransactionQuerySchema {
  type?: enum[8 types]
  page?: string (regex: /^\d+$/)
  limit?: string (regex: /^\d+$/)
}
```

**Current Status**: Partially complete
- ✅ Has basic structure
- ⚠️ Missing detailed descriptions
- ⚠️ Missing example responses
- ⚠️ Missing error scenarios

**Updates Needed**:
1. Add detailed descriptions for each endpoint
2. Include commission breakdown in deposit response
3. Document withdrawal limits ($10 min, $10,000 max)
4. Add populated user objects in transaction responses
5. Document all error codes (400, 401, 403, 500)

---

### 2. Job-Request Module OpenAPI (Offer Endpoints)

**File**: `src/api/job-request/job-request.openapi.ts`

**New Endpoints to Document**:

1. `POST /api/job-request/:applicationId/send-offer` - Customer sends offer
2. `POST /api/job-request/offer/:offerId/accept` - Contractor accepts offer
3. `POST /api/job-request/offer/:offerId/reject` - Contractor rejects offer

**Schema Definitions**:

```typescript
// Request schemas (from job-request.validation.ts)
SendOfferSchema {
  amount: number (min 10, max 10000)
  timeline: string (min 1, max 100)
  description: string (min 10, max 1000)
}

RejectOfferSchema {
  reason: string (min 10, max 500)
}

// Response schemas
OfferSchema {
  _id: string
  job: string
  customer: string
  contractor: string
  application: string
  amount: number
  platformFee: number (5%)
  serviceFee: number (20%)
  contractorPayout: number (80%)
  totalCharge: number (amount + platformFee)
  timeline: string
  description: string
  status: enum[pending, accepted, rejected, cancelled, completed, expired]
  acceptedAt?: string
  rejectedAt?: string
  cancelledAt?: string
  completedAt?: string
  expiresAt?: string
  rejectionReason?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

SendOfferResponseSchema {
  status: 201
  message: string
  data: {
    offer: OfferSchema
    walletBalance: number
    amounts: {
      jobBudget: number
      platformFee: number
      serviceFee: number
      contractorPayout: number
      totalCharge: number
      adminTotal: number
    }
  }
}

AcceptOfferResponseSchema {
  status: 200
  message: string
  data: {
    offer: OfferSchema
    job: JobSchema
    payment: {
      platformFee: number
      serviceFee: number
      contractorPayout: number
    }
  }
}

RejectOfferResponseSchema {
  status: 200
  message: string
  data: {
    offer: OfferSchema
    refundAmount: number
  }
}
```

**Current Status**: Likely missing
- ❌ Offer endpoints not documented
- ❌ Commission breakdown not shown
- ❌ Escrow process not explained

**Updates Needed**:
1. Add all three offer endpoints
2. Document commission structure (5% + 20%)
3. Explain escrow hold on send-offer
4. Document refund process on reject
5. Show wallet balance changes
6. Add validation error examples

---

### 3. Job Module OpenAPI (Payment Endpoints)

**File**: `src/api/job/job.openapi.ts`

**Endpoints to Document**:

1. `POST /api/job/:id/complete` - Mark job complete (triggers payment release)
2. `POST /api/job/:id/cancel` - Cancel job (triggers refund)
3. `PATCH /api/job/:id/status` - Update job status

**Schema Definitions**:

```typescript
CompleteJobResponseSchema {
  status: 200
  message: string
  data: {
    job: {
      _id: string
      status: "completed"
      completedAt: string
    }
    payment: {
      serviceFee: number (20%)
      contractorPayout: number (80%)
      adminCommission: number (5% + 20%)
    }
  }
}

CancelJobRequestSchema {
  reason: string (min 10, max 500)
}

CancelJobResponseSchema {
  status: 200
  message: string
  data: {
    job: {
      _id: string
      status: "cancelled"
      cancelledAt: string
      cancellationReason: string
    }
    refundAmount: number
  }
}

UpdateJobStatusRequestSchema {
  status: enum[open, assigned, in_progress, completed, cancelled]
}
```

**Current Status**: Partially complete
- ⚠️ May have basic job endpoints
- ❌ Payment-specific responses not documented
- ❌ Commission breakdown missing

**Updates Needed**:
1. Add payment details to complete-job response
2. Add refund details to cancel-job response
3. Document valid status transitions
4. Show authorization requirements
5. Add error scenarios

---

### 4. Constants File Update

**File**: `src/common/constants.ts`

**Current State**:
```typescript
export const openAPITags = {
  wallet: {
    name: "Wallet",
    basepath: "/api/wallet",
  },
  job_request: {
    name: "Job Application Request",
    basepath: "/api/job-request",
  },
  // ... other tags
};
```

**Updates Needed**:
1. Verify wallet tag exists ✅ (already present)
2. Update job_request name to include "& Offers"
3. Remove any bidding references
4. Ensure consistency with documentation

**Proposed Update**:
```typescript
export const openAPITags = {
  wallet: {
    name: "Wallet",
    basepath: "/api/wallet",
  },
  job_request: {
    name: "Job Application & Offers",  // UPDATED
    basepath: "/api/job-request",
  },
  // Remove: bidding (if exists)
};
```

---

### 5. Bidding Module Removal

**Action**: Delete empty bidding directory

**Steps**:
1. Verify no code references `src/api/bidding`
2. Delete `src/api/bidding/` directory
3. Update documentation to clarify offers are in job-request
4. Remove any bidding imports from app.ts (if exist)

**Verification**:
```bash
# Search for bidding references
grep -r "bidding" src/
grep -r "bidding" doc/
```

---

## Data Models

### Wallet Object (Complete)

```typescript
interface Wallet {
  _id: string;
  user: string;
  balance: number;           // Available for withdrawal
  escrowBalance: number;     // Held in escrow
  currency: string;          // "USD"
  isActive: boolean;
  isFrozen: boolean;
  totalEarnings: number;     // Lifetime earnings
  totalSpent: number;        // Lifetime spending
  totalWithdrawals: number;  // Lifetime withdrawals
  createdAt: string;
  updatedAt: string;
}
```

### Transaction Object (Complete)

```typescript
interface Transaction {
  _id: string;
  type: "platform_fee" | "service_fee" | "contractor_payout" | 
        "refund" | "deposit" | "withdrawal" | 
        "escrow_hold" | "escrow_release";
  amount: number;
  from: {
    _id: string;
    full_name: string;
    email: string;
  };
  to: {
    _id: string;
    full_name: string;
    email: string;
  };
  offer?: string;
  job?: string;
  status: "pending" | "completed" | "failed";
  description: string;
  failureReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Offer Object (Complete)

```typescript
interface Offer {
  _id: string;
  job: string;
  customer: string;
  contractor: string;
  application: string;
  
  // Amounts
  amount: number;              // Job budget (e.g., 100)
  platformFee: number;         // 5% (e.g., 5)
  serviceFee: number;          // 20% (e.g., 20)
  contractorPayout: number;    // 80% (e.g., 80)
  totalCharge: number;         // amount + platformFee (e.g., 105)
  
  // Details
  timeline: string;
  description: string;
  
  // Status
  status: "pending" | "accepted" | "rejected" | 
          "cancelled" | "completed" | "expired";
  
  // Timestamps
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  expiresAt?: string;
  
  // Reasons
  rejectionReason?: string;
  cancellationReason?: string;
  
  createdAt: string;
  updatedAt: string;
}
```

---

## Error Handling

### Standard Error Response

All endpoints must document this error format:

```typescript
interface ErrorResponse {
  status: number;
  message: string;
  data: null;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Common Error Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Validation failed, insufficient balance, invalid state |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Wrong role, wallet frozen, not authorized |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Unexpected errors |

### Error Examples by Module

**Wallet Errors**:
- `400` - "Insufficient balance. Available: $X"
- `400` - "Minimum deposit amount is $10"
- `400` - "Minimum withdrawal amount is $10"
- `400` - "Maximum withdrawal amount is $10,000"
- `403` - "Only contractors can withdraw funds"
- `403` - "Wallet is frozen. Please contact support."

**Offer Errors**:
- `400` - "Insufficient balance. Required: $X, Available: $Y"
- `400` - "Job is not open for offers"
- `400` - "An offer already exists for this job"
- `400` - "Offer not found or already processed"
- `403` - "Not authorized to send offer"
- `403` - "Not authorized to accept offer"

**Job Errors**:
- `400` - "Job not found or not in progress"
- `400` - "Cannot transition from X to Y"
- `400` - "Cannot cancel completed job"
- `403` - "Not authorized to complete job"

---

## Testing Strategy

### OpenAPI Validation

1. **Schema Validation**
   - All request schemas must validate with Zod
   - All response schemas must match actual responses
   - Error schemas must cover all error cases

2. **Documentation Completeness**
   - Every endpoint has description and summary
   - Every parameter is documented
   - Every response code is documented
   - Security requirements are specified

3. **Example Accuracy**
   - Response examples match actual API responses
   - Error examples show real error messages
   - Amount calculations are correct

### Manual Testing

1. **Swagger UI**
   - Open http://localhost:4000/swagger
   - Verify all wallet endpoints appear
   - Verify all offer endpoints appear
   - Test "Try it out" functionality

2. **Scalar UI**
   - Open http://localhost:4000/scaler
   - Verify documentation is readable
   - Check code examples are correct
   - Verify search functionality works

3. **JSON Export**
   - Download http://localhost:4000/api-docs.json
   - Validate with OpenAPI validator
   - Import into Postman
   - Generate client code

### Automated Testing

```typescript
// Test that OpenAPI spec is valid
describe('OpenAPI Specification', () => {
  it('should generate valid OpenAPI document', () => {
    const doc = generateOpenAPIDocument();
    expect(doc.openapi).toBe('3.0.0');
    expect(doc.paths).toBeDefined();
  });
  
  it('should include all wallet endpoints', () => {
    const doc = generateOpenAPIDocument();
    expect(doc.paths['/api/wallet']).toBeDefined();
    expect(doc.paths['/api/wallet/deposit']).toBeDefined();
    expect(doc.paths['/api/wallet/withdraw']).toBeDefined();
    expect(doc.paths['/api/wallet/transactions']).toBeDefined();
  });
  
  it('should include all offer endpoints', () => {
    const doc = generateOpenAPIDocument();
    expect(doc.paths['/api/job-request/{applicationId}/send-offer']).toBeDefined();
    expect(doc.paths['/api/job-request/offer/{offerId}/accept']).toBeDefined();
    expect(doc.paths['/api/job-request/offer/{offerId}/reject']).toBeDefined();
  });
});
```

---

## Implementation Approach

### Phase 1: Audit Current State
1. Review wallet.openapi.ts
2. Review job-request.openapi.ts
3. Review job.openapi.ts
4. Identify missing documentation
5. Document findings

### Phase 2: Update Wallet Module
1. Add detailed descriptions
2. Add commission breakdown
3. Document withdrawal limits
4. Add error scenarios
5. Test in Swagger UI

### Phase 3: Update Job-Request Module
1. Add send-offer endpoint
2. Add accept-offer endpoint
3. Add reject-offer endpoint
4. Document commission structure
5. Test in Swagger UI

### Phase 4: Update Job Module
1. Add payment details to complete-job
2. Add refund details to cancel-job
3. Document status transitions
4. Test in Swagger UI

### Phase 5: Cleanup
1. Delete bidding directory
2. Update constants file
3. Update documentation references
4. Verify no broken links

### Phase 6: Validation
1. Generate OpenAPI JSON
2. Validate with OpenAPI tools
3. Import into Postman
4. Test all endpoints
5. Generate client code

---

## Design Decisions

### Decision 1: Keep Offers in Job-Request Module

**Rationale**: Offers are tightly coupled with job applications. A contractor must first apply before receiving an offer. Keeping them together maintains logical cohesion.

**Alternative Considered**: Separate bidding module
**Why Rejected**: Would create unnecessary complexity and duplicate code

### Decision 2: Remove Empty Bidding Module

**Rationale**: Empty directories confuse developers and suggest incomplete features.

**Alternative Considered**: Implement bidding module
**Why Rejected**: Functionality already exists in job-request module

### Decision 3: Use Centralized Constants

**Rationale**: Single source of truth for API paths prevents inconsistencies.

**Alternative Considered**: Hardcode paths in each openapi file
**Why Rejected**: Makes refactoring difficult and error-prone

### Decision 4: Document Commission Breakdown

**Rationale**: Frontend needs to show users exactly what they'll pay/receive.

**Alternative Considered**: Hide commission details
**Why Rejected**: Transparency is critical for trust

### Decision 5: Include Populated User Objects

**Rationale**: Frontend needs user details for transaction history display.

**Alternative Considered**: Return only user IDs
**Why Rejected**: Would require additional API calls

---

## Success Metrics

1. ✅ All wallet endpoints documented
2. ✅ All offer endpoints documented
3. ✅ All payment endpoints documented
4. ✅ Bidding module removed
5. ✅ Constants file updated
6. ✅ OpenAPI spec validates
7. ✅ Swagger UI displays correctly
8. ✅ Postman import works
9. ✅ Client code generation works
10. ✅ No broken documentation links

---

## Maintenance Plan

### Regular Updates

1. **When adding new endpoints**:
   - Create openapi file immediately
   - Register with global registry
   - Test in Swagger UI

2. **When modifying endpoints**:
   - Update openapi documentation
   - Update validation schemas
   - Update response examples

3. **When deprecating endpoints**:
   - Mark as deprecated in openapi
   - Add deprecation notice
   - Document migration path

### Documentation Review

- Review OpenAPI docs quarterly
- Update examples with real data
- Fix any reported issues
- Keep in sync with code changes

---

## Conclusion

This design provides a clear path to complete and accurate OpenAPI documentation for the JobSphere payment system. By following the established patterns and maintaining consistency, we ensure that frontend and mobile developers have the information they need to integrate successfully.

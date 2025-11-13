# Implementation Plan - OpenAPI Documentation Update

## Overview

This implementation plan provides step-by-step tasks to complete and validate OpenAPI documentation for the JobSphere payment system. Each task builds incrementally and focuses on code implementation.

---

## Tasks

- [ ] 1. Audit current OpenAPI documentation state

  - Review `src/api/wallet/wallet.openapi.ts` and identify missing documentation
  - Review `src/api/job-request/job-request.openapi.ts` for offer endpoint documentation
  - Review `src/api/job/job.openapi.ts` for payment endpoint documentation
  - Create audit report listing all missing or incomplete documentation
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 6.2, 6.3_

- [ ] 2. Update wallet module OpenAPI documentation

  - [ ] 2.1 Enhance wallet endpoint descriptions and examples

    - Add detailed descriptions for GET /api/wallet endpoint
    - Add detailed descriptions for POST /api/wallet/deposit endpoint
    - Add detailed descriptions for POST /api/wallet/withdraw endpoint
    - Add detailed descriptions for GET /api/wallet/transactions endpoint
    - Include commission breakdown in deposit response examples
    - Document withdrawal limits ($10 min, $10,000 max) in descriptions
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ] 2.2 Add comprehensive error responses to wallet endpoints

    - Add 400 error for insufficient balance with example
    - Add 400 error for minimum deposit/withdrawal violations
    - Add 403 error for contractor-only withdrawal restriction
    - Add 403 error for frozen wallet scenario
    - Add 401 error for missing authentication
    - Add 500 error for internal server errors
    - _Requirements: 1.4, 5.3_

  - [ ] 2.3 Enhance transaction response schema with populated user objects
    - Update TransactionSchema to show populated from/to user objects
    - Add example showing full user details (name, email) in transactions
    - Document all 8 transaction types with descriptions
    - _Requirements: 1.3, 5.2_

- [ ] 3. Add offer endpoints to job-request OpenAPI documentation

  - [ ] 3.1 Document send-offer endpoint

    - Register POST /api/job-request/:applicationId/send-offer path
    - Add SendOfferSchema request body documentation
    - Create SendOfferResponseSchema with commission breakdown
    - Include walletBalance and amounts object in response
    - Document validation rules (amount: $10-$10,000, timeline: 1-100 chars, description: 10-1000 chars)
    - Add error responses (400 insufficient balance, 400 job not open, 400 offer exists, 403 not authorized)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.2 Document accept-offer endpoint

    - Register POST /api/job-request/offer/:offerId/accept path
    - Create AcceptOfferResponseSchema with offer, job, and payment details
    - Document platform fee deduction (5%) in response
    - Document job status change to "assigned"
    - Add error responses (400 offer already processed, 403 not authorized)
    - _Requirements: 2.1, 2.3_

  - [ ] 3.3 Document reject-offer endpoint

    - Register POST /api/job-request/offer/:offerId/reject path
    - Add RejectOfferSchema request body (reason field)
    - Create RejectOfferResponseSchema with refund details
    - Document full refund process in description
    - Add error responses (400 offer not found, 403 not authorized)
    - _Requirements: 2.1, 2.4_

  - [ ] 3.4 Create comprehensive offer schema definitions
    - Define OfferSchema with all fields (amounts, status, timestamps, reasons)
    - Document all offer status values (pending, accepted, rejected, cancelled, completed, expired)
    - Show commission breakdown (platformFee: 5%, serviceFee: 20%, contractorPayout: 80%)
    - Add examples for each offer status
    - _Requirements: 2.2, 2.3, 5.2_

- [ ] 4. Update job module OpenAPI for payment endpoints

  - [ ] 4.1 Enhance complete-job endpoint documentation

    - Update POST /api/job/:id/complete response schema
    - Add payment details object (serviceFee: 20%, contractorPayout: 80%, adminCommission: 25%)
    - Document payment release process in description
    - Add prerequisites (job must be in_progress, customer must own job)
    - Add error responses (400 invalid status, 403 not authorized)
    - _Requirements: 3.1, 3.2, 5.3_

  - [ ] 4.2 Enhance cancel-job endpoint documentation

    - Update POST /api/job/:id/cancel request and response schemas
    - Add CancelJobRequestSchema with reason field
    - Add refundAmount to response schema
    - Document refund process in description
    - Add error responses (400 cannot cancel completed, 403 not authorized)
    - _Requirements: 3.1, 3.2, 5.3_

  - [ ] 4.3 Document job status transitions
    - Add UpdateJobStatusRequestSchema with status enum
    - Document valid status transitions (open→assigned, assigned→in_progress, etc.)
    - Add authorization requirements for each transition
    - Add error responses for invalid transitions
    - _Requirements: 3.1, 5.3_

- [ ] 5. Update constants file and cleanup

  - [ ] 5.1 Update openAPITags in constants file

    - Change job_request name from "Job Application Request" to "Job Application & Offers"
    - Verify wallet tag exists and is correct
    - Remove any bidding references if present
    - Ensure all payment-related paths are registered
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 5.2 Remove empty bidding module
    - Search codebase for any references to bidding module
    - Delete `src/api/bidding/` directory
    - Verify no imports reference bidding in app.ts
    - Update any documentation that mentions bidding module
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Validate OpenAPI documentation

  - [ ] 6.1 Test in Swagger UI

    - Start development server
    - Open http://localhost:4000/swagger
    - Verify all wallet endpoints appear under "Wallet" tag
    - Verify all offer endpoints appear under "Job Application & Offers" tag
    - Test "Try it out" functionality for each endpoint
    - Verify request/response examples are accurate
    - _Requirements: 5.1, 5.2, 5.3, 6.5_

  - [ ] 6.2 Test in Scalar UI

    - Open http://localhost:4000/scaler
    - Verify documentation is readable and well-formatted
    - Check that code examples are correct
    - Verify search functionality finds payment endpoints
    - Test navigation between related endpoints
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 6.3 Validate OpenAPI JSON export
    - Download http://localhost:4000/api-docs.json
    - Validate JSON with OpenAPI validator tool
    - Import into Postman and verify collection structure
    - Test generating TypeScript client code
    - Verify all payment endpoints are included
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Final verification and documentation update
  - Run TypeScript type checking to ensure no errors
  - Verify all OpenAPI files are imported in their respective route files
  - Update FRONTEND_API_DOCUMENTATION.md if needed
  - Create summary of changes made
  - _Requirements: 5.4, 5.5, 6.6_

---

## Task Execution Notes

### Prerequisites

- Development server must be running for testing
- All validation schemas must exist before updating OpenAPI
- Constants file must be updated before testing

### Testing Approach

- After each module update, test in Swagger UI immediately
- Verify examples match actual API responses
- Check that error codes are accurate
- Ensure security requirements are documented

### Common Patterns to Follow

**Endpoint Registration**:

```typescript
registry.registerPath({
  method: "post",
  path: `${openAPITags.wallet.basepath}/deposit`,
  description: "Detailed description of what this endpoint does",
  summary: "Short summary",
  tags: [openAPITags.wallet.name],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        [mediaTypeFormat.json]: {
          schema: DepositSchema,
        },
      },
    },
  },
  responses: {
    200: {
      /* success response */
    },
    400: {
      /* validation error */
    },
    401: {
      /* unauthorized */
    },
    500: {
      /* server error */
    },
  },
});
```

**Error Response Pattern**:

```typescript
400: {
  description: "Bad request - Specific error description",
  content: {
    [mediaTypeFormat.json]: {
      schema: ErrorResponseSchema,
    },
  },
}
```

**Response Schema Pattern**:

```typescript
const ResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: DataSchema, // or z.null() for errors
});
```

### Validation Checklist

For each endpoint, verify:

- [ ] Description is clear and detailed
- [ ] Summary is concise
- [ ] Correct tag is used
- [ ] Security requirement is specified (if needed)
- [ ] Request schema is documented (if applicable)
- [ ] All response codes are documented
- [ ] Error responses include examples
- [ ] Examples match actual API behavior

---

## Success Criteria

- ✅ All wallet endpoints have complete OpenAPI documentation
- ✅ All offer endpoints are documented in job-request module
- ✅ All payment endpoints are documented in job module
- ✅ Bidding module is removed
- ✅ Constants file is updated
- ✅ Swagger UI displays all endpoints correctly
- ✅ Scalar UI displays all endpoints correctly
- ✅ OpenAPI JSON validates successfully
- ✅ Postman import works
- ✅ No TypeScript errors
- ✅ All tests pass

---

## Estimated Effort

- Task 1 (Audit): 30 minutes
- Task 2 (Wallet): 1 hour
- Task 3 (Offers): 2 hours
- Task 4 (Job): 1 hour
- Task 5 (Cleanup): 30 minutes
- Task 6 (Validation): 1 hour
- Task 7 (Final): 30 minutes

**Total**: ~6.5 hours

---

## Notes

- Focus on one module at a time
- Test after each major change
- Keep examples realistic and accurate
- Follow existing patterns in the codebase
- Document any deviations from the design

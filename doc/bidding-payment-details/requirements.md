# Requirements Document - OpenAPI Documentation Update

## Introduction

This specification addresses the need to ensure all payment system modules have complete and accurate OpenAPI documentation. The JobSphere payment system includes wallet management and offer/bidding functionality that must be properly documented for frontend/mobile developers.

## Glossary

- **OpenAPI**: A specification for describing RESTful APIs in a machine-readable format
- **Wallet Module**: API endpoints for managing user wallet balance, deposits, withdrawals, and transactions
- **Offer System**: Payment flow where customers send offers to contractors through job applications
- **Job-Request Module**: Existing module that handles job applications AND offer management
- **Bidding Module**: Empty/unused directory that should be removed or repurposed
- **Zod Schema**: TypeScript-first schema validation library used for request/response validation
- **Registry**: Global OpenAPI registry that collects all endpoint definitions

## Requirements

### Requirement 1: Wallet Module OpenAPI Documentation

**User Story:** As a frontend developer, I want complete OpenAPI documentation for wallet endpoints, so that I can integrate wallet functionality correctly.

#### Acceptance Criteria

1. WHEN reviewing wallet.openapi.ts, THE System SHALL include all four wallet endpoints with complete request/response schemas
2. WHEN a wallet endpoint is called, THE System SHALL validate requests using the registered Zod schemas
3. WHEN viewing API documentation, THE System SHALL display accurate wallet response examples with all fields
4. WHEN an error occurs, THE System SHALL return standardized error responses as documented
5. WHERE wallet endpoints require authentication, THE System SHALL document the bearerAuth security requirement

### Requirement 2: Job-Request Module Offer Endpoints Documentation

**User Story:** As a mobile developer, I want complete OpenAPI documentation for offer endpoints, so that I can implement the payment flow correctly.

#### Acceptance Criteria

1. WHEN reviewing job-request.openapi.ts, THE System SHALL include documentation for send-offer, accept-offer, and reject-offer endpoints
2. WHEN an offer endpoint is called, THE System SHALL validate the offer amount is between $10 and $10,000
3. WHEN viewing offer documentation, THE System SHALL display the commission breakdown (5% platform fee, 20% service fee)
4. WHEN an offer is sent, THE System SHALL document the escrow hold process in the response schema
5. WHERE offer endpoints exist in job-request module, THE System SHALL use consistent naming with "Job Application & Offers" tag

### Requirement 3: Bidding Module Cleanup

**User Story:** As a developer, I want to remove or clarify the empty bidding module, so that the codebase structure is clear and maintainable.

#### Acceptance Criteria

1. WHEN examining the bidding directory, THE System SHALL either contain complete implementation OR be removed
2. IF bidding module is removed, THEN THE System SHALL update any references in documentation
3. IF bidding module is kept, THEN THE System SHALL implement complete route, validation, and openapi files
4. WHEN reviewing payment documentation, THE System SHALL clarify that offers are handled in job-request module
5. WHERE documentation mentions "bidding", THE System SHALL use consistent terminology with actual implementation

### Requirement 4: Constants File Update

**User Story:** As a developer, I want centralized API path constants for all payment endpoints, so that paths are consistent across the application.

#### Acceptance Criteria

1. WHEN adding new modules, THE System SHALL register their paths in src/common/constants.ts
2. WHEN wallet endpoints are documented, THE System SHALL use openAPITags.wallet constants
3. IF offer endpoints are documented, THEN THE System SHALL use openAPITags.job_request constants
4. WHEN paths change, THE System SHALL update only the constants file
5. WHERE nested endpoints exist, THE System SHALL use template literals with base paths

### Requirement 5: Documentation Consistency

**User Story:** As an API consumer, I want consistent documentation patterns across all modules, so that integration is predictable.

#### Acceptance Criteria

1. WHEN documenting any endpoint, THE System SHALL follow the established OpenAPI pattern
2. WHEN defining response schemas, THE System SHALL include status, message, and data fields
3. WHEN documenting errors, THE System SHALL include all possible HTTP status codes
4. WHEN authentication is required, THE System SHALL document security requirements
5. WHERE pagination exists, THE System SHALL document page, limit, and total fields consistently

### Requirement 6: Missing Module Identification

**User Story:** As a project maintainer, I want to identify any payment-related modules missing OpenAPI documentation, so that documentation is complete.

#### Acceptance Criteria

1. WHEN reviewing src/api directory, THE System SHALL list all modules related to payment system
2. WHEN a module has routes, THE System SHALL verify corresponding openapi file exists
3. IF a module lacks openapi documentation, THEN THE System SHALL flag it for update
4. WHEN payment documentation references an endpoint, THE System SHALL verify it exists in code
5. WHERE modules are registered in app.ts, THE System SHALL verify their openapi files are imported

## Out of Scope

- Implementation of new payment features
- Modification of existing business logic
- Database schema changes
- Stripe integration updates
- Frontend/mobile code implementation
- Performance optimization
- Security audits

## Success Criteria

1. All wallet endpoints have complete OpenAPI documentation
2. All offer endpoints in job-request module are documented
3. Bidding module is either removed or fully implemented
4. Constants file includes all payment-related paths
5. Documentation follows consistent patterns
6. No payment-related modules are missing OpenAPI files
7. API documentation UI (Swagger/Scalar) displays all endpoints correctly
8. Frontend developers can generate API clients from OpenAPI spec

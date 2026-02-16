# Core Features & Business Logic

## Authentication & Authorization

### Authentication Strategy

- JWT-based with access and refresh token rotation
- Access tokens: Short-lived (15 days dev, 15-30 min production)
- Refresh tokens: Long-lived (30 days), rotated on each use
- Tokens stored in response body (not cookies) for mobile compatibility

### Authentication Flows

- **Registration**: Email, password, role (customer/contractor)
- **Login**: Credentials validation, token generation
- **Forgot Password**: OTP generation (4-digit, 10-15 min expiry)
- **Reset Password**: OTP verification, password update
- **Refresh Token**: Token rotation for security
- **Get Current User**: Fetch authenticated user data

### Authorization

- Role-based access control (RBAC)
- Middleware: `requireAuth`, `requireRole`, `requireAnyRole`, `requireOwnership`
- Three roles: Customer, Contractor, Admin
- Resource ownership validation

## Job System

### Job Lifecycle

```
open → assigned → in_progress → completed
  ↓                                  ↓
cancelled ←─────────────────────────┘
```

### Job Features

- **Job Posting**: Title, description, budget, categories, locations, cover image
- **Job Search**: Filter by category, location, budget range, status
- **Job Applications**: Contractors apply, customers review and accept/reject
- **Job Invitations**: Customers invite specific contractors
- **Engaged Jobs**: Special endpoint showing jobs with applications or offers

### Application System

- Contractors apply to open jobs
- One application per contractor per job
- Status: pending/accepted/rejected/cancelled
- Customer reviews and responds to applications

### Invitation System

- Customer invites specific contractors to jobs
- Contractor accepts or rejects invitations
- Invitation expiration after configurable period
- Available contractors list for selection

## Payment & Offer System

### Commission Structure

- **Platform Fee**: 5% (charged on offer acceptance)
- **Service Fee**: 20% (charged on job completion)
- **Contractor Payout**: 80% (released on job completion)
- **Total Customer Pays**: Job budget + 5% platform fee
- **Total Admin Commission**: 25% (5% + 20%)

### Payment Flow

1. Customer deposits via Stripe Checkout (backend returns URL, opens in browser)
2. Customer sends offer → No wallet change yet (pending acceptance)
3. Contractor accepts → Wallet balances updated in DB only (customer -$105, admin +$105)
4. Job in progress → Contractor works on job
5. Customer marks complete → Creates request for admin approval
6. Admin approves → Wallet balances updated (admin -$80, contractor +$80), admin initiates Stripe Connect transfer
7. Alternative: Job cancelled → DB wallet refund (admin -$105, customer +$105)

### Offer System

- Customer sends offer after reviewing application
- One offer per job (enforced by unique index on job field)
- Offer includes: amount, timeline, description, calculated fees
- Offer status: pending, accepted, rejected, cancelled, completed, expired
- Acceptance triggers payment flow and job assignment
- Rejection triggers full refund to customer

### Wallet System

- Internal wallet for each user (auto-created on first use)
- Single balance tracking (no separate escrow)
- Transaction types: deposit, withdrawal, wallet_transfer, contractor_payout, refund
- Stripe Checkout for deposits (returns URL for browser)
- Stripe Connect for contractor payouts (admin-approved)
- Complete transaction history and audit trail
- Withdrawal feature for contractors (admin-approved)
- Wallet can be frozen by admin for security

### Database Models

- **Wallet**: User balance, escrow, totals (earnings, spent, withdrawals)
- **Offer**: Job offer with payment breakdown and status
- **Transaction**: Complete audit trail of all money movements
- **Job**: Extended with payment fields (contractorId, offerId, assignedAt, completedAt)

### API Endpoints

- `GET /api/wallet` - Get wallet balance
- `POST /api/wallet/deposit` - Add money (manual, Stripe pending)
- `POST /api/wallet/withdraw` - Withdraw money (contractors only)
- `GET /api/wallet/transactions` - Transaction history with pagination
- `POST /api/job-request/:applicationId/send-offer` - Send offer
- `POST /api/job-request/offer/:offerId/accept` - Accept offer
- `POST /api/job-request/offer/:offerId/reject` - Reject offer
- `POST /api/job/:id/complete` - Mark job complete (releases payment)
- `POST /api/job/:id/cancel` - Cancel job (triggers refund)

### Payment Documentation

Complete payment system documentation available in `doc/payment/`:
- `README.md` - Navigation and quick reference
- `1.SYSTEM_OVERVIEW.md` - Business logic and architecture
- `2.BACKEND_IMPLEMENTATION.md` - Implementation guide
- `3.FRONTEND_API_GUIDE.md` - API reference with code examples
- `REFERENCE.md` - Original detailed reference

### Future: Stripe Integration

- Payment Intents for deposits (real credit card processing)
- Stripe Connect for contractor payouts (bank transfers)
- Webhook handling for payment confirmation
- See `doc/payment/` for Stripe integration plans

## Real-Time Communication

### Socket.IO Chat System

- One-to-one messaging between customers and contractors
- Room-based architecture for conversations
- JWT authentication for socket connections
- Message types: text, image, file, offer

### Chat Features

- Message history with pagination
- Online/offline status tracking
- Typing indicators
- Read receipts (sent/delivered/read)
- File sharing support
- Unread message counts

### Chat Events

- Client → Server: authenticate, join_conversation, send_message, typing_start/stop, mark_as_read
- Server → Client: new_message, message_delivered, message_read, user_typing, user_online_status

### REST API Complement

- Get conversation list
- Get message history (paginated)
- Create new conversation
- Upload files for chat

## Push Notifications

### Firebase Cloud Messaging (FCM)

- Multi-device support per user
- Notification history persistence
- 10 notification types: job updates, messages, payments, offers, invitations, reviews, etc.

### Notification Features

- Register/unregister device tokens
- Send to single user, multiple users, or role-based broadcast
- Mark notifications as read
- Delete notifications
- Notification history with pagination

## User Profiles

### Contractor Portfolio

- **Experience**: Company name, title, description, start/end dates
- **Certifications**: Title, image, description, issue/expiry dates, issuing organization
- **Work Samples**: Name, image, description

### Profile Management

- Profile and cover images
- Skills and availability
- Bio and description
- Location and category preferences
- Review and rating aggregation

### Profile Structure

- Main profile endpoints: `/api/user`
- Nested sub-modules: `/api/user/certifications`, `/api/user/experience`, `/api/user/work-samples`
- CRUD operations for each portfolio item
- Ownership validation (users can only modify their own data)

## Review System

- Job completion enables review submission
- Reviews linked to job and users
- Rating and feedback system
- Review aggregation for contractor profiles

## File Management

- Local storage in `/uploads` folder using Multer
- File types: Profile images, portfolios, certifications, chat attachments
- File validation (size, type)
- Future: Cloud storage migration (AWS S3)

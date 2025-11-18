# Core Features

## Real-Time Communication

### Socket.IO Chat System
- One-to-one messaging between customers and contractors
- Message history with pagination
- Online/offline status tracking
- Typing indicators and read receipts
- File sharing (images, documents)
- JWT authentication for socket connections
- Room-based architecture for conversations

**Architecture**:
```
src/api/chat/
├── socket/
│   ├── index.ts              # Socket.IO server setup
│   ├── middleware/           # Auth & logging
│   ├── handlers/             # Chat, typing, status
│   └── utils/                # Room management
└── services/                 # REST API (conversations, messages)
```

**Key Events**:
- Client → Server: `join_conversation`, `send_message`, `typing_start/stop`, `mark_as_read`
- Server → Client: `new_message`, `message_delivered`, `message_read`, `user_typing`, `user_online_status`

### Push Notifications (FCM)
- Firebase Cloud Messaging for mobile notifications
- Multi-device support per user
- Notification history persistence
- 10 notification types (job updates, messages, payments, etc.)

**Service**: `src/common/service/notification.service.ts`
- `sendToUser()` - Single user
- `sendToMultipleUsers()` - Multiple users
- `sendToRole()` - Broadcast to role (contractor/customer/admin)

**Endpoints**:
- `POST /api/notification/register-token` - Register device
- `DELETE /api/notification/unregister-token` - Unregister device
- `GET /api/notification` - Get notifications
- `POST /api/notification/mark-read` - Mark as read
- `DELETE /api/notification/:id` - Delete notification

### Email System (Nodemailer)
- OTP verification emails
- Welcome emails
- Templates in `src/common/email/`

## File Upload System
- Local storage in `/uploads` folder (Multer)
- File types: Profile images, portfolios, certifications, chat attachments
- File validation (size, type)
- Future: Cloud storage migration (AWS S3)

**Endpoint**: `POST /api/common/upload`

## Payment & Wallet System

### Wallet-Based Transactions
- Internal wallet for each user
- Escrow system for job payments
- Transaction history and audit trail

**Commission Structure**:
- Platform Fee: 5% (charged on offer acceptance)
- Service Fee: 20% (charged on job completion)
- Contractor Payout: 80% (released on job completion)
- Admin Total: 25%

### Payment Flow
1. Customer sends offer → Wallet charged (job budget + 5% platform fee)
2. Contractor accepts → Platform fee to admin, rest held in escrow
3. Job completed → Service fee to admin (20%), contractor receives 80%
4. Contractor withdraws → Transfer to bank account

### Wallet Endpoints
- `GET /api/wallet` - Get balance
- `POST /api/wallet/deposit` - Add funds
- `POST /api/wallet/withdraw` - Withdraw funds (contractors only)
- `GET /api/wallet/transactions` - Transaction history

### Offer System
- `POST /api/offer/send` - Customer sends offer
- `POST /api/offer/:id/accept` - Contractor accepts
- `POST /api/offer/:id/reject` - Contractor rejects (refund issued)
- One offer per job (enforced by unique index)

### Job Completion
- `POST /api/job/:id/complete` - Mark complete (triggers payment release)
- `POST /api/job/:id/cancel` - Cancel job (triggers refund)

### Future: Stripe Integration
- External payment processing
- Stripe Connect for contractor payouts
- Webhook handling for payment events

## Database Models

### Key Models

**User**: Roles (customer/contractor/admin), profile data, portfolio references, auth tokens
**Job**: Title, description, budget, status (open/assigned/in_progress/completed/cancelled)
**Offer**: Job budget, commission breakdown, status, timestamps
**Wallet**: Balance, escrow balance, transaction history
**Transaction**: Type, amount, from/to users, status
**Conversation**: Participants, last message, unread counts
**Message**: Content, type (text/image/file), status (sent/delivered/read)
**Notification**: User, title, body, type, read status
**FCM Token**: Device tokens for push notifications
**Experience/WorkSample/Certification**: Contractor portfolio items

See `src/db/models/` for complete schemas.

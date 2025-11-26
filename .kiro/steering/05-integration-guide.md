# Integration & Implementation Guide

## Socket.IO Integration

### Server Setup
- Initialize Socket.IO server in `src/api/chat/socket/index.ts`
- Attach to HTTP server, not Express app
- Configure CORS for client origins
- Set ping timeout and interval for connection health

### Authentication
- Use JWT authentication middleware for socket connections
- Verify token from `socket.handshake.auth.token` or authorization header
- Attach user data to `socket.data` for access in handlers

### Room Management
- Use deterministic room IDs for 1-on-1 chats
- Sort user IDs to ensure consistent room naming
- Join rooms on `join_conversation` event
- Broadcast messages to room participants

### Event Handlers
- Organize handlers by feature (chat, typing, status)
- Register handlers in connection callback
- Use `io.to(room).emit()` for broadcasting
- Use `socket.emit()` for individual responses

### Database Persistence
- Save all messages to database
- Update conversation's last message
- Track unread counts per user
- Store message status (sent/delivered/read)

### Client Support
- Flutter: `socket_io_client` package
- Web: `socket.io-client` package
- Auto-reconnection with exponential backoff
- Event-based communication

## Firebase Cloud Messaging (FCM)

### Setup
- Initialize Firebase Admin SDK in `src/lib/firebase.ts`
- Use service account JSON for authentication
- Store FCM tokens in database per user (multi-device support)

### Token Management
- Register device tokens via `/api/notification/register-token`
- Unregister tokens on logout via `/api/notification/unregister-token`
- Handle invalid tokens (remove from database)

### Sending Notifications
- Use shared notification service: `src/common/service/notification.service.ts`
- Methods: `sendToUser()`, `sendToMultipleUsers()`, `sendToRole()`
- Include notification type, title, body, and data payload
- Save notification to database for history

### Notification Types
- Job updates (posted, assigned, completed, cancelled)
- Messages (new message, typing)
- Payments (offer sent, payment received, withdrawal)
- Invitations (job invite, offer)
- Reviews (new review)

## Email Integration

### Setup
- Use Nodemailer with SMTP configuration
- Store credentials in environment variables
- Email templates in `src/common/email/`

### Email Types
- OTP verification (4-digit code, 10-15 min expiry)
- Welcome emails
- Password reset confirmation
- Job notifications (optional)

### Template System
- HTML templates with placeholders
- Dynamic content injection
- Responsive design for mobile

## File Upload Integration

### Current Implementation
- Local storage in `/uploads` folder
- Multer middleware for file handling
- File validation (size, type)
- Endpoint: `POST /api/common/upload`

### File Types
- Profile images (users)
- Cover images (jobs, profiles)
- Portfolio images (work samples, certifications)
- Chat attachments (images, documents)

### Future Migration
- Cloud storage (AWS S3, Google Cloud Storage)
- CDN integration for faster delivery
- Image optimization and resizing
- Signed URLs for secure access

## Payment Integration

### Current: Wallet System
- Internal wallet for each user
- Escrow-based transactions
- Commission structure: 5% platform fee + 20% service fee
- Transaction history and audit trail

### Future: Stripe Integration
- Payment intent creation with manual capture
- Stripe Connect for contractor payouts
- Webhook handling for payment events
- Refund processing
- Bank account verification

### Payment Flow
1. Customer deposits funds to wallet
2. Offer sent → Wallet charged (budget + 5% platform fee)
3. Offer accepted → Platform fee to admin, rest in escrow
4. Job completed → Service fee to admin, contractor receives 80%
5. Contractor withdraws to bank account

## Database Integration

### MongoDB Connection
- Connection managed in `src/lib/connect-mongo.ts`
- Connection string from environment variable
- Retry logic for connection failures
- Connection pooling for performance

### Mongoose Models
- Define schemas with TypeScript interfaces
- Use timestamps for createdAt/updatedAt
- Define indexes for query optimization
- Use virtuals for computed fields
- Use pre/post hooks for business logic

### Model Registration
- Export all models via `db` object in `src/db/index.ts`
- Centralized access: `db.user`, `db.job`, etc.
- Type-safe model access

## Environment Configuration

### Required Variables
- `PORT` - Server port (default: 4000)
- `MONGODB_URI` - MongoDB connection string
- `ACCESS_SECRET` - JWT access token secret
- `REFRESH_SECRET` - JWT refresh token secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `FIREBASE_SERVICE_ACCOUNT` - Path to Firebase service account JSON
- `CLIENT_URL` - Frontend URL for CORS

### Optional Variables
- `NODE_ENV` - Environment (development/production)
- `REDIS_URL` - Redis connection for Socket.IO scaling
- `STRIPE_SECRET_KEY` - Stripe API key (future)
- `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` - AWS credentials (future)
- `MAX_FILE_SIZE` - File upload limit
- `SOCKET_DEBUG` - Enable Socket.IO debug logging

## Logging & Monitoring

### Winston Logger
- Daily rotating file logs
- Separate files for errors and combined logs
- Console output in development
- Structured logging with timestamps

### Log Levels
- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages (development only)

### Monitoring Points
- API request/response times
- Database query performance
- Socket.IO connection metrics
- Payment transaction success/failure rates
- Email delivery status
- FCM notification delivery

## Testing Strategy

### Unit Tests
- Test individual service functions
- Mock database calls
- Test validation schemas
- Test utility functions

### Integration Tests
- Test API endpoints end-to-end
- Test authentication flows
- Test payment flows
- Test Socket.IO events

### Testing Tools
- Jest or Vitest for test runner
- Supertest for API testing
- Socket.IO client for socket testing
- MongoDB Memory Server for database testing

## Deployment Considerations

### Production Checklist
- Set `NODE_ENV=production`
- Use short-lived access tokens (15-30 min)
- Enable HTTPS only
- Configure CORS for specific origins
- Set up Redis for Socket.IO scaling
- Configure database connection pooling
- Set up monitoring and alerting
- Configure log rotation
- Set up backup strategy
- Configure rate limiting

### Scaling Strategies
- Horizontal scaling with load balancer
- Redis adapter for Socket.IO multi-server support
- Database read replicas for read-heavy operations
- CDN for static file delivery
- Caching layer (Redis) for frequently accessed data
- Queue system (Bull, BullMQ) for background jobs

### Security Hardening
- Use helmet for security headers
- Implement rate limiting (express-rate-limit)
- Sanitize user input
- Use parameterized queries (Mongoose does this)
- Implement CSRF protection
- Regular dependency updates
- Security audits (npm audit)

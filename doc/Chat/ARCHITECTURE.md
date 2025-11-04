# Chat System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        JobSphere Backend                         │
│                                                                   │
│  ┌────────────────┐              ┌──────────────────┐           │
│  │   Express.js   │              │   Socket.IO      │           │
│  │   REST API     │              │   Server         │           │
│  └────────┬───────┘              └────────┬─────────┘           │
│           │                               │                      │
│           │                               │                      │
│  ┌────────▼───────────────────────────────▼─────────┐           │
│  │            Authentication Layer                   │           │
│  │         (JWT Verification Middleware)             │           │
│  └────────┬───────────────────────────────┬─────────┘           │
│           │                               │                      │
│  ┌────────▼───────┐              ┌────────▼─────────┐           │
│  │  Chat Routes   │              │  Socket Handlers │           │
│  │  - GET /conv   │              │  - send_message  │           │
│  │  - POST /conv  │              │  - typing        │           │
│  │  - GET /msg    │              │  - status        │           │
│  └────────┬───────┘              └────────┬─────────┘           │
│           │                               │                      │
│           └───────────┬───────────────────┘                      │
│                       │                                          │
│              ┌────────▼─────────┐                                │
│              │   Database       │                                │
│              │   - Conversation │                                │
│              │   - Message      │                                │
│              │   - User         │                                │
│              └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
                       │
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐           ┌────────▼────────┐
│  Flutter App   │           │   Web Client    │
│  (Mobile)      │           │   (React/Vue)   │
└────────────────┘           └─────────────────┘
```

## Component Architecture

### 1. REST API Layer

```
┌─────────────────────────────────────────────────────┐
│                   REST API                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  GET /api/chat/conversations                        │
│  ├─ requireAuth middleware                          │
│  ├─ getConversations service                        │
│  └─ Returns: List of conversations with metadata    │
│                                                     │
│  POST /api/chat/conversations                       │
│  ├─ requireAuth middleware                          │
│  ├─ validateBody middleware                         │
│  ├─ createConversation service                      │
│  └─ Returns: New or existing conversation           │
│                                                     │
│  GET /api/chat/conversations/:id/messages           │
│  ├─ requireAuth middleware                          │
│  ├─ getMessages service                             │
│  └─ Returns: Paginated message history              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2. Socket.IO Layer

```
┌─────────────────────────────────────────────────────┐
│                Socket.IO Server                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Connection Flow:                                   │
│  1. Client connects with JWT token                  │
│  2. Auth middleware verifies token                  │
│  3. User data attached to socket                    │
│  4. Event handlers registered                       │
│  5. Online status updated                           │
│                                                     │
│  Event Handlers:                                    │
│  ┌─────────────────────────────────────┐           │
│  │  Chat Handler                       │           │
│  │  - join_conversation                │           │
│  │  - send_message                     │           │
│  │  - mark_as_read                     │           │
│  │  - leave_conversation               │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │  Typing Handler                     │           │
│  │  - typing_start                     │           │
│  │  - typing_stop                      │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │  Status Handler                     │           │
│  │  - get_online_status                │           │
│  │  - track online/offline             │           │
│  └─────────────────────────────────────┘           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Message Sending Flow

```
Customer                Server                  Contractor
   │                      │                         │
   │  1. send_message     │                         │
   ├─────────────────────>│                         │
   │                      │                         │
   │                      │ 2. Save to DB           │
   │                      │ ┌─────────┐             │
   │                      │ │ Message │             │
   │                      │ └─────────┘             │
   │                      │                         │
   │                      │ 3. Update conversation  │
   │                      │ ┌──────────────┐        │
   │                      │ │ Conversation │        │
   │                      │ └──────────────┘        │
   │                      │                         │
   │  4. message_delivered│                         │
   │<─────────────────────┤                         │
   │                      │                         │
   │                      │ 5. new_message          │
   │                      ├────────────────────────>│
   │                      │                         │
```

### Conversation Creation Flow

```
Customer                Server                  Database
   │                      │                         │
   │  1. POST /conversations                        │
   ├─────────────────────>│                         │
   │  { participantId }   │                         │
   │                      │                         │
   │                      │ 2. Check existing       │
   │                      ├────────────────────────>│
   │                      │                         │
   │                      │ 3. Return result        │
   │                      │<────────────────────────┤
   │                      │                         │
   │                      │ 4. If not exists,       │
   │                      │    create new           │
   │                      ├────────────────────────>│
   │                      │                         │
   │  5. Return conversation                        │
   │<─────────────────────┤                         │
   │                      │                         │
```

### Real-Time Typing Indicator Flow

```
Customer                Server                  Contractor
   │                      │                         │
   │  1. typing_start     │                         │
   ├─────────────────────>│                         │
   │                      │                         │
   │                      │ 2. user_typing          │
   │                      │    (isTyping: true)     │
   │                      ├────────────────────────>│
   │                      │                         │
   │  ... user types ...  │                         │
   │                      │                         │
   │  3. typing_stop      │                         │
   ├─────────────────────>│                         │
   │                      │                         │
   │                      │ 4. user_typing          │
   │                      │    (isTyping: false)    │
   │                      ├────────────────────────>│
   │                      │                         │
```

## Database Schema Relationships

```
┌──────────────────┐
│      User        │
│                  │
│  _id             │◄─────────┐
│  name            │          │
│  email           │          │
│  role            │          │
│  avatar          │          │
└──────────────────┘          │
                              │
                              │ participants
                              │
┌──────────────────┐          │
│  Conversation    │          │
│                  │          │
│  _id             │          │
│  participants    ├──────────┘
│  lastMessage     │
│  unreadCount     │
│  jobId           │◄─────────┐
│  createdAt       │          │
│  updatedAt       │          │
└────────┬─────────┘          │
         │                    │
         │ conversationId     │
         │                    │
         │                    │
┌────────▼─────────┐          │
│     Message      │          │
│                  │          │
│  _id             │          │
│  conversationId  │          │
│  senderId        ├──────────┤
│  receiverId      │          │
│  messageType     │          │
│  content         │          │
│  status          │          │
│  timestamp       │          │
│  createdAt       │          │
└──────────────────┘          │
                              │
┌──────────────────┐          │
│       Job        │          │
│                  │          │
│  _id             ├──────────┘
│  title           │
│  budget          │
│  ...             │
└──────────────────┘
```

## Authentication Flow

### REST API Authentication

```
Client                  Middleware              Service
   │                       │                       │
   │  1. Request with      │                       │
   │     Bearer token      │                       │
   ├──────────────────────>│                       │
   │                       │                       │
   │                       │ 2. Extract token      │
   │                       │    from header        │
   │                       │                       │
   │                       │ 3. Verify JWT         │
   │                       │    signature          │
   │                       │                       │
   │                       │ 4. Decode payload     │
   │                       │    { userId, role }   │
   │                       │                       │
   │                       │ 5. Attach to req.user │
   │                       │                       │
   │                       │ 6. Call next()        │
   │                       ├──────────────────────>│
   │                       │                       │
   │                       │                       │ 7. Process
   │                       │                       │    request
   │                       │                       │
   │  8. Response          │                       │
   │<──────────────────────┴───────────────────────┤
   │                                               │
```

### Socket.IO Authentication

```
Client                  Middleware              Socket Handler
   │                       │                       │
   │  1. Connect with      │                       │
   │     auth: { token }   │                       │
   ├──────────────────────>│                       │
   │                       │                       │
   │                       │ 2. Extract token      │
   │                       │    from handshake     │
   │                       │                       │
   │                       │ 3. Verify JWT         │
   │                       │                       │
   │                       │ 4. Attach to          │
   │                       │    socket.data        │
   │                       │                       │
   │                       │ 5. Call next()        │
   │                       ├──────────────────────>│
   │                       │                       │
   │  6. 'connect' event   │                       │
   │<──────────────────────┴───────────────────────┤
   │                                               │
   │  7. Register event handlers                   │
   │                                               │
```

## Room Management

### Room Structure

```
┌─────────────────────────────────────────────────┐
│            Socket.IO Rooms                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Room: "user123_user456"                        │
│  ├─ Socket: abc123 (user123)                    │
│  └─ Socket: def456 (user456)                    │
│                                                 │
│  Room: "user123_user789"                        │
│  ├─ Socket: abc123 (user123)                    │
│  └─ Socket: ghi789 (user789)                    │
│                                                 │
│  Room: "user456_user789"                        │
│  ├─ Socket: def456 (user456)                    │
│  └─ Socket: ghi789 (user789)                    │
│                                                 │
└─────────────────────────────────────────────────┘

Note: Room IDs are deterministic (sorted user IDs)
      user123_user456 === user456_user123
```

### Broadcasting in Rooms

```
User A sends message in room "userA_userB"

┌──────────────────────────────────────────┐
│  io.to("userA_userB").emit("new_message")│
└──────────────┬───────────────────────────┘
               │
               ├─────────────┬─────────────┐
               │             │             │
         ┌─────▼────┐  ┌─────▼────┐  ┌────▼─────┐
         │ User A   │  │ User B   │  │ User C   │
         │ (sender) │  │ (in room)│  │ (not in  │
         │ receives │  │ receives │  │  room)   │
         └──────────┘  └──────────┘  │ doesn't  │
                                     │ receive  │
                                     └──────────┘
```

## Scalability Architecture (Future)

### Single Server (Current)

```
┌─────────────────────────────────────┐
│         Express + Socket.IO         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   In-Memory Online Status    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      MongoDB Database        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Multi-Server (Production)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Server 1    │    │  Server 2    │    │  Server 3    │
│  Socket.IO   │    │  Socket.IO   │    │  Socket.IO   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Redis Adapter  │
                  │  (Pub/Sub)      │
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌───▼────┐ ┌────▼─────┐
       │   Redis    │ │ MongoDB│ │  Redis   │
       │  (Status)  │ │  (Data)│ │ (Cache)  │
       └────────────┘ └────────┘ └──────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────┐
│              Error Handling                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Try-Catch Blocks                               │
│  ├─ Service Layer                               │
│  ├─ Socket Handlers                             │
│  └─ Middleware                                  │
│                                                 │
│  Error Responses                                │
│  ├─ REST API: JSON { status, message, data }   │
│  └─ Socket.IO: emit('error', { message })       │
│                                                 │
│  Logging                                        │
│  ├─ console.error() for debugging               │
│  └─ Winston logger (already configured)         │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Performance Optimization Points

### 1. Database Queries

```
┌─────────────────────────────────────┐
│  Indexes (Already Implemented)      │
├─────────────────────────────────────┤
│  Conversation:                      │
│  - participants                     │
│  - lastMessage.timestamp            │
│                                     │
│  Message:                           │
│  - conversationId + timestamp       │
│  - senderId                         │
│  - receiverId + status              │
└─────────────────────────────────────┘
```

### 2. Caching Strategy (Future)

```
┌─────────────────────────────────────┐
│  Redis Caching                      │
├─────────────────────────────────────┤
│  - Online status (TTL: 5 min)       │
│  - Recent conversations (TTL: 1 min)│
│  - Unread counts (TTL: 30 sec)      │
└─────────────────────────────────────┘
```

### 3. Message Pagination

```
┌─────────────────────────────────────┐
│  Pagination Strategy                │
├─────────────────────────────────────┤
│  - Default: 50 messages per page    │
│  - Sort: timestamp DESC             │
│  - Skip: (page - 1) * limit         │
│  - Reverse: Show oldest first       │
└─────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────┐
│              Security Layers                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Layer 1: Network                               │
│  ├─ CORS configuration                          │
│  ├─ HTTPS (production)                          │
│  └─ Firewall rules                              │
│                                                 │
│  Layer 2: Authentication                        │
│  ├─ JWT verification                            │
│  ├─ Token expiration                            │
│  └─ Secure token storage                        │
│                                                 │
│  Layer 3: Authorization                         │
│  ├─ Participant verification                    │
│  ├─ Resource ownership check                    │
│  └─ Role-based access                           │
│                                                 │
│  Layer 4: Input Validation                      │
│  ├─ Zod schema validation                       │
│  ├─ Type checking                               │
│  └─ Sanitization                                │
│                                                 │
│  Layer 5: Rate Limiting (Future)                │
│  ├─ Per-user message limits                     │
│  ├─ Connection throttling                       │
│  └─ API rate limits                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Monitoring Points

```
┌─────────────────────────────────────────────────┐
│              Monitoring Metrics                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Socket.IO Metrics                              │
│  ├─ Active connections count                    │
│  ├─ Messages per second                         │
│  ├─ Average message latency                     │
│  └─ Connection errors                           │
│                                                 │
│  Database Metrics                               │
│  ├─ Query response time                         │
│  ├─ Connection pool usage                       │
│  └─ Failed queries                              │
│                                                 │
│  Application Metrics                            │
│  ├─ Memory usage                                │
│  ├─ CPU usage                                   │
│  ├─ Error rate                                  │
│  └─ Response time                               │
│                                                 │
└─────────────────────────────────────────────────┘
```

This architecture provides a solid foundation for a scalable, secure, and maintainable chat system!

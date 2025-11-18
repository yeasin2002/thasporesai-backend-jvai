# Pino Logging Usage Examples

## Quick Start

```typescript
import { logInfo, logError, logWarn, logDebug } from "@/lib/pino";
```

## Common Use Cases

### 1. Service Handler Logging

```typescript
import type { RequestHandler } from "express";
import { sendInternalError, sendSuccess } from "@/helpers";
import { logError, logInfo } from "@/lib/pino";
import { db } from "@/db";

export const createJob: RequestHandler = async (req, res) => {
  try {
    const userId = req.user!.id;

    logInfo("Creating new job", {
      userId,
      title: req.body.title,
      budget: req.body.budget,
    });

    const job = await db.job.create({
      ...req.body,
      customerId: userId,
    });

    logInfo("Job created successfully", {
      jobId: job._id,
      userId,
    });

    return sendSuccess(res, 201, "Job created successfully", job);
  } catch (error) {
    logError("Failed to create job", error, {
      userId: req.user?.id,
      body: req.body,
    });
    return sendInternalError(res, "Failed to create job");
  }
};
```

### 2. Authentication Logging

```typescript
import { logInfo, logWarn, logError } from "@/lib/pino";

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.user.findOne({ email });
    if (!user) {
      logWarn("Login attempt with non-existent email", { email });
      return sendUnauthorized(res, "Invalid credentials");
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      logWarn("Failed login attempt", {
        userId: user._id,
        email,
        ip: req.ip,
      });
      return sendUnauthorized(res, "Invalid credentials");
    }

    logInfo("User logged in successfully", {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return sendSuccess(res, 200, "Login successful", {
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    logError("Login error", error, {
      email: req.body.email,
      ip: req.ip,
    });
    return sendInternalError(res, "Login failed");
  }
};
```

### 3. Payment Processing Logging

```typescript
import { logInfo, logError, logWarn } from "@/lib/pino";

export const processPayment: RequestHandler = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user!.id;

    logInfo("Starting payment processing", {
      offerId,
      userId,
      amount: req.body.amount,
    });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount * 100,
      currency: "usd",
    });

    logInfo("Stripe payment intent created", {
      paymentIntentId: paymentIntent.id,
      offerId,
      amount: req.body.amount,
    });

    // Save to database
    const payment = await db.payment.create({
      offerId,
      userId,
      amount: req.body.amount,
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
    });

    logInfo("Payment record created", {
      paymentId: payment._id,
      offerId,
      userId,
    });

    return sendSuccess(res, 200, "Payment initiated", payment);
  } catch (error) {
    logError("Payment processing failed", error, {
      offerId: req.params.offerId,
      userId: req.user?.id,
      amount: req.body.amount,
    });
    return sendInternalError(res, "Payment processing failed");
  }
};
```

### 4. Database Operation Logging

```typescript
import { logDebug, logError } from "@/lib/pino";

export const getUserById = async (userId: string) => {
  try {
    logDebug("Fetching user from database", { userId });

    const user = await db.user.findById(userId);

    if (user) {
      logDebug("User found", {
        userId: user._id,
        email: user.email,
      });
    } else {
      logDebug("User not found", { userId });
    }

    return user;
  } catch (error) {
    logError("Database query failed", error, {
      operation: "findById",
      collection: "users",
      userId,
    });
    throw error;
  }
};
```

### 5. Middleware Logging

```typescript
import { logInfo, logWarn } from "@/lib/pino";
import type { RequestHandler } from "express";

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      logWarn("Missing authentication token", {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });
      return sendUnauthorized(res, "Authentication required");
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;

    logDebug("User authenticated", {
      userId: decoded.userId,
      email: decoded.email,
      url: req.originalUrl,
    });

    next();
  } catch (error) {
    logWarn("Invalid authentication token", {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
    return sendUnauthorized(res, "Invalid token");
  }
};
```

### 6. Socket.IO Event Logging

```typescript
import { logInfo, logError, logDebug } from "@/lib/pino";

export const registerChatHandlers = (io: Server, socket: Socket) => {
  socket.on("send_message", async (data) => {
    try {
      const userId = socket.data.userId;

      logDebug("Received message event", {
        userId,
        conversationId: data.conversationId,
        messageType: data.messageType,
      });

      const message = await db.message.create({
        conversationId: data.conversationId,
        senderId: userId,
        receiverId: data.receiverId,
        messageType: data.messageType,
        content: data.content,
      });

      logInfo("Message sent", {
        messageId: message._id,
        conversationId: data.conversationId,
        senderId: userId,
        receiverId: data.receiverId,
      });

      io.to(data.conversationId).emit("new_message", message);
    } catch (error) {
      logError("Failed to send message", error, {
        userId: socket.data.userId,
        conversationId: data.conversationId,
      });
      socket.emit("error", { message: "Failed to send message" });
    }
  });
};
```

### 7. Scheduled Job Logging

```typescript
import { logInfo, logError, logWarn } from "@/lib/pino";

export const startOfferExpirationJob = () => {
  setInterval(async () => {
    try {
      logInfo("Starting offer expiration job");

      const expiredOffers = await db.offer.find({
        status: "pending",
        expiresAt: { $lt: new Date() },
      });

      logInfo("Found expired offers", {
        count: expiredOffers.length,
      });

      for (const offer of expiredOffers) {
        try {
          await db.offer.findByIdAndUpdate(offer._id, {
            status: "expired",
          });

          logInfo("Offer expired", {
            offerId: offer._id,
            jobId: offer.job,
          });
        } catch (error) {
          logError("Failed to expire offer", error, {
            offerId: offer._id,
          });
        }
      }

      logInfo("Offer expiration job completed", {
        processed: expiredOffers.length,
      });
    } catch (error) {
      logError("Offer expiration job failed", error);
    }
  }, 60000); // Run every minute
};
```

### 8. File Upload Logging

```typescript
import { logInfo, logError, logWarn } from "@/lib/pino";

export const uploadFile: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      logWarn("File upload attempted without file", {
        userId: req.user?.id,
        url: req.originalUrl,
      });
      return sendBadRequest(res, "No file provided");
    }

    logInfo("File upload started", {
      userId: req.user!.id,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const fileUrl = `/uploads/${req.file.filename}`;

    logInfo("File uploaded successfully", {
      userId: req.user!.id,
      filename: req.file.filename,
      fileUrl,
      size: req.file.size,
    });

    return sendSuccess(res, 200, "File uploaded successfully", {
      fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    logError("File upload failed", error, {
      userId: req.user?.id,
      filename: req.file?.originalname,
    });
    return sendInternalError(res, "File upload failed");
  }
};
```

### 9. Notification Logging

```typescript
import { logInfo, logError, logWarn } from "@/lib/pino";

export class NotificationService {
  static async sendToUser(params: {
    userId: string;
    title: string;
    body: string;
    type: string;
    data?: any;
  }) {
    try {
      logInfo("Sending notification", {
        userId: params.userId,
        type: params.type,
        title: params.title,
      });

      const tokens = await db.fcmToken.find({
        userId: params.userId,
        isActive: true,
      });

      if (tokens.length === 0) {
        logWarn("No active FCM tokens found", {
          userId: params.userId,
        });
        return;
      }

      const messaging = getMessaging();
      const results = await Promise.allSettled(
        tokens.map((token) =>
          messaging.send({
            token: token.token,
            notification: {
              title: params.title,
              body: params.body,
            },
            data: params.data,
          })
        )
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failureCount = results.filter(
        (r) => r.status === "rejected"
      ).length;

      logInfo("Notification sent", {
        userId: params.userId,
        type: params.type,
        successCount,
        failureCount,
        totalTokens: tokens.length,
      });

      // Save to database
      await db.notification.create({
        userId: params.userId,
        title: params.title,
        body: params.body,
        type: params.type,
        data: params.data,
        isSent: successCount > 0,
        sentAt: new Date(),
      });
    } catch (error) {
      logError("Failed to send notification", error, {
        userId: params.userId,
        type: params.type,
      });
    }
  }
}
```

### 10. Error Handler Logging

```typescript
import { logError } from "@/lib/pino";
import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logError("Unhandled error", err, {
    status,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendError(
    res,
    status,
    status === 500 ? "Internal Server Error" : message
  );
};
```

## Log Output Examples

### Console Output (Development)

```
[2025-11-18 10:30:45] INFO - Creating new job
  userId: "user_123"
  title: "Need a plumber"
  budget: 500

[2025-11-18 10:30:45] INFO - Job created successfully
  jobId: "job_456"
  userId: "user_123"

[2025-11-18 10:30:46] INFO - POST /api/job 201 - 45ms
  request: {
    method: "POST",
    url: "/api/job",
    body: { title: "Need a plumber", budget: 500 }
  }
  response: { statusCode: 201 }
  responseTime: 45
```

### File Output (JSON)

```json
{
  "level": "INFO",
  "time": "2025-11-18T10:30:45.123Z",
  "type": "info",
  "msg": "Creating new job",
  "userId": "user_123",
  "title": "Need a plumber",
  "budget": 500
}
{
  "level": "INFO",
  "time": "2025-11-18T10:30:45.456Z",
  "type": "info",
  "msg": "Job created successfully",
  "jobId": "job_456",
  "userId": "user_123"
}
```

## Tips

1. **Always include context**: userId, jobId, offerId, etc.
2. **Use appropriate log levels**: debug for verbose, info for important events, warn for issues, error for failures
3. **Never log sensitive data**: passwords, tokens, credit cards
4. **Log before and after important operations**: helps track flow
5. **Include timing information**: helps identify performance issues
6. **Use structured data**: easier to search and analyze

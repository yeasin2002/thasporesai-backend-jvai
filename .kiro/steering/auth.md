# Authentication & Authorization

## Authentication Strategy

JobSphere uses JWT (JSON Web Tokens) with access and refresh token rotation for secure authentication.

## Token System

### Access Token

- Short-lived token (currently 15 days for development, should be 15-30 minutes in production)
- Used for API authentication
- Stored in memory on client side
- Contains user ID, email, and role
- Verified using `verifyAccessToken()` from `@/lib/jwt`

### Refresh Token

- Long-lived token (30 days)
- Used to obtain new access tokens
- Stored in response body (not httpOnly cookies) for mobile app compatibility
- Contains JTI (JWT ID) for tracking
- Rotated on each use for enhanced security
- Stored in user document's `refreshTokens` array
- Invalidated on logout

## Authentication Flows

### Registration

- **Endpoint**: `POST /api/auth/register`
- **Roles**: Customer, Contractor
- **Required Fields**: email, password, name, role, phone
- **Process**:
  1. Validate input data
  2. Check if email already exists
  3. Hash password
  4. Create user document
  5. Send verification email (optional)
  6. Return success message

### Login

- **Endpoint**: `POST /api/auth/login`
- **Required Fields**: email, password
- **Process**:
  1. Validate credentials
  2. Check user status (active/blocked)
  3. Generate access token
  4. Generate refresh token
  5. Store refresh token in database
  6. Return both tokens with user data

### Forgot Password

- **Endpoint**: `POST /api/auth/forgot-password`
- **Required Fields**: email
- **Process**:
  1. Verify email exists
  2. Generate 6-digit OTP
  3. Store OTP with expiration (10-15 minutes)
  4. Send OTP via email
  5. Return success message

### Reset Password

- **Endpoint**: `POST /api/auth/reset-password`
- **Required Fields**: email, otp, newPassword
- **Process**:
  1. Verify OTP validity and expiration
  2. Hash new password
  3. Update user password
  4. Invalidate OTP
  5. Return success message

### Refresh Token

- **Endpoint**: `POST /api/auth/refresh`
- **Required Fields**: refreshToken
- **Process**:
  1. Verify refresh token validity
  2. Check if token exists in database
  3. Generate new access token
  4. Generate new refresh token (rotation)
  5. Invalidate old refresh token
  6. Return new tokens

### Verify OTP

- **Endpoint**: `POST /api/auth/verify-otp`
- **Required Fields**: email, otp
- **Process**:
  1. Verify OTP validity and expiration (10-15 minutes)
  2. Mark OTP as verified
  3. Return success message (allows user to proceed to reset password)
  
**Note**: OTP is a 4-digit code generated using `generateOTP()` from `@/lib/jwt`

### Get Current User (Me)

- **Endpoint**: `GET /api/user/me`
- **Required Fields**: accessToken (in Authorization header: `Bearer <token>`)
- **Middleware**: `requireAuth`
- **Process**:
  1. Verify access token validity (handled by middleware)
  2. Fetch user data from database using `req.user.id` or `req.user.userId`
  3. Return user data without sensitive fields (password, refreshTokens, otp)
  
**Note**: `req.user` contains `{ id, userId, email, role }` after authentication

## Authorization Middleware

### Role-Based Access Control

```typescript
import { requireAuth, requireRole, requireAnyRole, requireOwnership, optionalAuth } from "@/middleware";

// Protect routes by authentication and role
app.get("/api/protected", requireAuth, handler); // Any authenticated user
app.get("/api/customer-only", requireAuth, requireRole("customer"), handler); // Customer only
app.get("/api/contractor-only", requireAuth, requireRole("contractor"), handler); // Contractor only
app.get("/api/admin-only", requireAuth, requireRole("admin"), handler); // Admin only
app.get("/api/flexible", requireAuth, requireAnyRole(["customer", "contractor"]), handler); // Multiple roles
app.get("/api/user/:id", requireAuth, requireOwnership("id"), handler); // User can only access their own resource
app.get("/api/optional", optionalAuth, handler); // Optional authentication
```

**Important**: 
- `requireRole()` and `requireAnyRole()` must be used AFTER `requireAuth`
- `requireOwnership()` checks if user is accessing their own resource or is admin
- Token must be in `Authorization` header as `Bearer <token>`

### Route Protection Examples

- **Public Routes**: Registration, Login, Forgot Password, Verify OTP, Browse jobs/categories
- **Optional Auth Routes**: Job listings (personalized if authenticated), contractor profiles
- **Customer Routes**: Create jobs, manage bookings, submit reviews
- **Contractor Routes**: Apply to jobs, manage profile, view earnings
- **Admin Routes**: User management, job moderation, system settings
- **Protected Admin Routes**: Use both `requireAuth` and `requireRole("admin")` middleware

## Security Best Practices

1. **Password Hashing**: Use bcrypt with salt rounds (10) via `hashPassword()` from `@/lib/jwt`
2. **Token Secrets**: Store in environment variables (`ACCESS_SECRET`, `REFRESH_SECRET`)
3. **Token Expiration**: Access token: 15 days (dev), Refresh token: 30 days
4. **Rate Limiting**: Prevent brute force attacks on auth endpoints (recommended)
5. **Input Validation**: Use Zod schemas for all auth inputs
6. **HTTPS Only**: Enforce secure connections in production
7. **Token Rotation**: Rotate refresh tokens on each use with new JTI
8. **Token Tracking**: Store refresh tokens in user document with JTI
9. **Send token as response**: Send access token and refresh token as response in JSON format (not in cookies)
10. **Token Storage**: Tokens are stored in response body, not httpOnly cookies, for mobile app compatibility
11. **OTP Expiration**: OTP expires after 10-15 minutes
12. **OTP Format**: 4-digit numeric code generated with `generateOTP()`

## Database Schema Considerations

### User Model

- Store hashed passwords only (using bcrypt)
- Include role field (customer, contractor, admin)
- Track account status with `isSuspend` boolean
- Store refresh tokens array with token, jti, and createdAt
- Store OTP object with code, expiresAt, and used flag
- Example structure:
  ```typescript
  {
    email: string,
    password: string, // hashed
    role: "customer" | "contractor" | "admin",
    isSuspend: boolean,
    refreshTokens: Array<{
      token: string,
      jti: string,
      createdAt: Date
    }>,
    otp: {
      code: string,
      expiresAt: Date,
      used: boolean
    }
  }
  ```

**Note**: OTP is stored directly in user document, not in a separate collection

import rateLimit from "express-rate-limit";

/**
 * Rate limiter for deposit endpoint
 * Limits: 5 requests per hour per IP
 */
export const depositRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    status: 429,
    message:
      "Too many deposit requests. Please try again later. Limit: 5 deposits per hour.",
    success: false,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests that don't actually create a charge
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: true,
});

/**
 * Rate limiter for withdrawal endpoint
 * Limits: 3 requests per hour per IP
 */
export const withdrawalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    status: 429,
    message:
      "Too many withdrawal requests. Please try again later. Limit: 3 withdrawals per hour.",
    success: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});

/**
 * Rate limiter for Connect account creation
 * Limits: 2 requests per hour per IP
 */
export const connectAccountRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // 2 requests per hour
  message: {
    status: 429,
    message:
      "Too many account creation requests. Please try again later. Limit: 2 requests per hour.",
    success: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    status: 429,
    message:
      "Too many requests from this IP. Please try again later. Limit: 100 requests per 15 minutes.",
    success: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

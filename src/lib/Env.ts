import "dotenv/config";

export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
export const PORT = process.env.PORT || 4000;
export const ACCESS_SECRET = process.env.ACCESS_SECRET as string;
export const REFRESH_SECRET = process.env.REFRESH_SECRET as string;
export const SMTP_USER = process.env.SMTP_USER as string;
export const SMTP_PASS = process.env.SMTP_PASS as string;
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const DATABASE_URL = process.env.DATABASE_URL as string;
export const SOCKET_DEBUG = process.env.SOCKET_DEBUG as string;
export const NODE_ENV = process.env.NODE_ENV as string;

// Stripe Configuration
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
export const STRIPE_WEBHOOK_SECRET = process.env
  .STRIPE_WEBHOOK_SECRET as string;

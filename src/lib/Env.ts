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

// ImageKit Configuration
export const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY as string;
export const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY as string;
export const IMAGEKIT_URL_ENDPOINT = process.env
  .IMAGEKIT_URL_ENDPOINT as string;

// Validate ImageKit configuration
if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
  console.warn(
    "⚠️  ImageKit configuration missing. Image upload features will not work."
  );
}

export const Env = {
  API_BASE_URL,
  PORT,
  ACCESS_SECRET,
  REFRESH_SECRET,
  SMTP_USER,
  SMTP_PASS,
  LOG_LEVEL,
  DATABASE_URL,
  SOCKET_DEBUG,
  NODE_ENV,
  IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT,
};

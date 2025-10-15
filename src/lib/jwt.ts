// src/utils/jwt.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const ACCESS_EXPIRES = "15m"; // short-lived
const REFRESH_EXPIRES_DAYS = 30; // refresh token lifetime

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access-secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh-secret";

function signAccessToken<T extends object>(payload: T) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function signRefreshToken<T>(payload: T) {
  // payload may include sub, etc. We'll also include jti
  const jti = crypto.randomBytes(16).toString("hex");
  const token = jwt.sign({ ...payload, jti }, REFRESH_SECRET, {
    expiresIn: `${REFRESH_EXPIRES_DAYS}d`,
  });
  return { token, jti };
}

async function hashToken(tokenOrId: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(tokenOrId, salt);
}

async function compareHash(tokenOrId: string, hash: string) {
  return bcrypt.compare(tokenOrId, hash);
}

function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}

export {
  compareHash,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};


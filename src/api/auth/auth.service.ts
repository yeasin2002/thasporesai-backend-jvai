import { sendOTPEmail, sendWelcomeEmail } from "@/common/email";
import { db } from "@/db";
import { sendError, sendSuccess, sendUnauthorized } from "@/helpers";
import {
	comparePassword,
	generateOTP,
	hashPassword,
	hashToken,
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} from "@/lib/jwt";
import type { RequestHandler } from "express";
import type {
	ForgotPassword,
	Login,
	RefreshToken,
	Register,
	ResetPassword,
	VerifyOTP,
} from "./auth.validation";

// Register Handler
export const register: RequestHandler<{}, unknown, Register> = async (
  req,
  res
) => {
  try {
    const { email, password, full_name, role, phone } = req.body;
    await sendWelcomeEmail(email, full_name);

    // Check if user already exists
    const existingUser = await db.user.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, "User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      full_name,
      email,
      password: hashedPassword,
      role: role || "customer",
      phone,
    });

    // Generate tokens
    const tokenPayload = {
      userId: user._id as string,
      email: user.email,
      role: user.role as "customer" | "contractor" | "admin",
    };

    const accessToken = signAccessToken(tokenPayload);
    const { token: refreshToken, jti } = signRefreshToken(tokenPayload);

    // Store hashed refresh token
    const hashedRefreshToken = await hashToken(refreshToken);
    user.refreshTokens.push({
      token: hashedRefreshToken,
      jti,
      createdAt: new Date(),
    });
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    const {
      password: _password,
      refreshTokens: _refreshTokens,
      otp: _otp,
      ...userWithoutSensitiveData
    } = userResponse;

    return sendSuccess(res, 201, "User registered successfully", {
      user: userWithoutSensitiveData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Register error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Login Handler
export const login: RequestHandler<{}, unknown, Login> = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.user.findOne({ email });
    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    // Check if account is active
    // if (!user.isActive) {
    //   return res.status(403).json({
    //     status: 403,
    //     message: "Account is suspended. Please contact support.",
    //     data: null,
    //   });
    // }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid email or password");
    }
    // Generate tokens
    const tokenPayload = {
      userId: user._id as string,
      email: user.email,
      role: user.role as "customer" | "contractor" | "admin",
    };

    const accessToken = signAccessToken(tokenPayload);
    const { token: refreshToken, jti } = signRefreshToken(tokenPayload);

    // Store hashed refresh token
    const hashedRefreshToken = await hashToken(refreshToken);
    user.refreshTokens.push({
      token: hashedRefreshToken,
      jti,
      createdAt: new Date(),
    });
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    const {
      password: _password,
      refreshTokens: _refreshTokens,
      otp: _otp,
      ...userWithoutSensitiveData
    } = userResponse;

    return sendSuccess(res, 200, "Login successful", {
      user: userWithoutSensitiveData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Forgot Password Handler
export const forgotPassword: RequestHandler<
  unknown,
  unknown,
  ForgotPassword
> = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await db.user.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return sendError(res, 404, "User not found");
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP
    user.otp = {
      code: otp,
      expiresAt,
      used: false,
    };
    await user.save();

    // Send OTP via email
    try {
      await sendOTPEmail(user.email, otp, user.full_name);
      console.log(`✅ OTP sent to ${email}: ${otp}`); // For development/debugging
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Log OTP to console as fallback
      console.log(`⚠️ Email failed. OTP for ${email}: ${otp}`);
      // Don't return error to user for security reasons
    }

    return sendSuccess(
      res,
      200,
      "If the email exists, an OTP has been sent",
      null
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Verify OTP Handler
export const verifyOTP: RequestHandler<{}, unknown, VerifyOTP> = async (
  req,
  res
) => {
  try {
    const { email, otp } = req.body;

    // Find user
    const user = await db.user.findOne({ email });
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Verify OTP
    if (!user.otp || !user.otp.code) {
      return sendError(res, 400, "No OTP found. Please request a new one.");
    }

    if (user.otp.used) {
      return sendError(res, 400, "OTP has already been used");
    }

    if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
      return sendError(res, 400, "OTP has expired. Please request a new one.");
    }

    if (user.otp.code !== otp) {
      return sendError(res, 400, "Invalid OTP");
    }

    // OTP is valid - don't mark as used yet, will be used in reset password
    return sendSuccess(
      res,
      200,
      "OTP verified successfully. You can now reset your password."
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Reset Password Handler
export const resetPassword: RequestHandler<{}, unknown, ResetPassword> = async (
  req,
  res
) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user
    const user = await db.user.findOne({ email });
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Verify OTP again (in case user skips verify step)
    if (!user.otp || !user.otp.code) {
      return sendError(res, 400, "No OTP found. Please request a new one.");
    }

    if (user.otp.used) {
      return sendError(res, 400, "OTP has already been used");
    }

    if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
      return sendError(res, 400, "OTP has expired. Please request a new one.");
    }

    if (user.otp.code !== otp) {
      return sendError(res, 400, "Invalid OTP");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark OTP as used
    user.password = hashedPassword;
    user.otp.used = true;

    // Invalidate all refresh tokens for security
    user.refreshTokens = [] as any;

    await user.save();

    return sendSuccess(
      res,
      200,
      "Password reset successfully. Please login with your new password.",
      null
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Refresh Token Handler
export const refresh: RequestHandler<{}, unknown, RefreshToken> = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    let decoded: ReturnType<typeof verifyRefreshToken>;
    try {
      decoded = verifyRefreshToken(refreshToken);
      // oxlint-disable-next-line no-unused-vars
    } catch (_error) {
      return sendError(res, 401, "Invalid or expired refresh token");
    }

    // Find user
    const user = await db.user.findById(decoded.userId);
    if (!user) return sendError(res, 401, "User not found");

    // Check if account is active
    // if (!user.isActive) {
    //   return res.status(403).json({
    //     status: 403,
    //     message: "Account is suspended",
    //     data: null,
    //   });
    // }

    // Verify refresh token exists in database
    const tokenIndex = user.refreshTokens.findIndex(
      (rt) => rt.jti === decoded.jti
    );

    if (tokenIndex === -1) {
      return sendError(res, 401, "Refresh token has been revoked");
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user._id as string,
      email: user.email,
      role: user.role as "customer" | "contractor" | "admin",
    };

    const accessToken = signAccessToken(tokenPayload);
    const { token: newRefreshToken, jti } = signRefreshToken(tokenPayload);

    // Remove old refresh token and add new one
    user.refreshTokens.splice(tokenIndex, 1);
    const hashedRefreshToken = await hashToken(newRefreshToken);
    user.refreshTokens.push({
      token: hashedRefreshToken,
      jti,
      createdAt: new Date(),
    });
    await user.save();

    return sendSuccess(res, 200, "Tokens refreshed successfully", {
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Get Current User (Me) Handler
export const me: RequestHandler = async (req, res) => {
  try {
    // This will be populated by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) return sendUnauthorized(res);

    const user = await db.user
      .findById(userId)
      .select("-password -refreshTokens -otp");

    if (!user) return sendError(res, 404, "User not found");

    return sendSuccess(res, 200, "User retrieved successfully", user);
  } catch (error) {
    console.error("Get user error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};

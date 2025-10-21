import { sendOTPEmail, sendWelcomeEmail } from "@/common/email";
import { db } from "@/db";
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
      return res.status(400).json({
        status: 400,
        message: "User with this email already exists",
        data: null,
      });
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

    res.status(201).json({
      status: 201,
      message: "User registered successfully",
      data: {
        user: userWithoutSensitiveData,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Login Handler
export const login: RequestHandler<{}, unknown, Login> = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.user.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Invalid email or password",
        data: null,
      });
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
      return res.status(401).json({
        status: 401,
        message: "Invalid email or password",
        data: null,
      });
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

    res.status(200).json({
      status: 200,
      message: "Login successful",
      data: {
        user: userWithoutSensitiveData,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
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
      return res.status(200).json({
        status: 200,
        message: "If the email exists, an OTP has been sent",
        data: null,
      });
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

    res.status(200).json({
      status: 200,
      message: "If the email exists, an OTP has been sent",
      data: null,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
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
      return res.status(400).json({
        status: 400,
        message: "Invalid OTP or email",
        data: null,
      });
    }

    // Verify OTP
    if (!user.otp || !user.otp.code) {
      return res.status(400).json({
        status: 400,
        message: "No OTP found. Please request a new one.",
        data: null,
      });
    }

    if (user.otp.used) {
      return res.status(400).json({
        status: 400,
        message: "OTP has already been used",
        data: null,
      });
    }

    if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        status: 400,
        message: "OTP has expired. Please request a new one.",
        data: null,
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        status: 400,
        message: "Invalid OTP",
        data: null,
      });
    }

    // OTP is valid - don't mark as used yet, will be used in reset password
    res.status(200).json({
      status: 200,
      message: "OTP verified successfully. You can now reset your password.",
      data: null,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
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
      return res.status(400).json({
        status: 400,
        message: "Invalid OTP or email",
        data: null,
      });
    }

    // Verify OTP again (in case user skips verify step)
    if (!user.otp || !user.otp.code) {
      return res.status(400).json({
        status: 400,
        message: "No OTP found. Please request a new one.",
        data: null,
      });
    }

    if (user.otp.used) {
      return res.status(400).json({
        status: 400,
        message: "OTP has already been used",
        data: null,
      });
    }

    if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        status: 400,
        message: "OTP has expired. Please request a new one.",
        data: null,
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        status: 400,
        message: "Invalid OTP",
        data: null,
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark OTP as used
    user.password = hashedPassword;
    user.otp.used = true;

    // Invalidate all refresh tokens for security
    user.refreshTokens = [] as any;

    await user.save();

    res.status(200).json({
      status: 200,
      message:
        "Password reset successfully. Please login with your new password.",
      data: null,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Refresh Token Handler
export const refresh: RequestHandler<{}, unknown, RefreshToken> = async (
  req,
  res
) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    let decoded: ReturnType<typeof verifyRefreshToken>;
    try {
      decoded = verifyRefreshToken(refreshToken);
      // oxlint-disable-next-line no-unused-vars
    } catch (_error) {
      return res.status(401).json({
        status: 401,
        message: "Invalid or expired refresh token",
        data: null,
      });
    }

    // Find user
    const user = await db.user.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "User not found",
        data: null,
      });
    }

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
      return res.status(401).json({
        status: 401,
        message: "Refresh token has been revoked",
        data: null,
      });
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

    res.status(200).json({
      status: 200,
      message: "Tokens refreshed successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Get Current User (Me) Handler
export const me: RequestHandler = async (req, res) => {
  try {
    // This will be populated by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        message: "Unauthorized",
        data: null,
      });
    }

    const user = await db.user
      .findById(userId)
      .select("-password -refreshTokens -otp");

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
        data: null,
      });
    }

    res.status(200).json({
      status: 200,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

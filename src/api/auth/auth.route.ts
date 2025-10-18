import "./auth.openapi";

import { validateBody } from "@/middleware/validation";
import express, { Router } from "express";
import {
  forgotPassword,
  login,
  me,
  refresh,
  register,
  resetPassword,
} from "./auth.service";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "./auth.validation";

export const auth: Router = express.Router();

// Public routes
auth.post("/register", validateBody(RegisterSchema), register);
auth.post("/login", validateBody(LoginSchema), login);
auth.post(
  "/forgot-password",
  validateBody(ForgotPasswordSchema),
  forgotPassword
);
auth.post("/reset-password", validateBody(ResetPasswordSchema), resetPassword);
auth.post("/refresh", validateBody(RefreshTokenSchema), refresh);

// Protected routes (will need auth middleware)
auth.get("/me", me); // TODO: Add auth middleware when created

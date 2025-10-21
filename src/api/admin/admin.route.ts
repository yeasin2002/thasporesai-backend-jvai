import "./admin.openapi";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  suspendUser,
} from "./admin.service";
import {
  SuspendUserSchema,
  UserIdParamSchema,
  UserQuerySchema,
} from "./admin.validation";

export const admin: Router = express.Router();

// User management routes
admin
  .get("/users", validateQuery(UserQuerySchema), getAllUsers)
  .get("/users/:id", validateParams(UserIdParamSchema), getUserById)
  .delete("/users/:id", validateParams(UserIdParamSchema), deleteUser)
  .patch(
    "/users/:id/suspend",
    validateParams(UserIdParamSchema),
    validateBody(SuspendUserSchema),
    suspendUser
  );

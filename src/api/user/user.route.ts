import { validateBody, validateParams } from "@/middleware/validation";
import express, { Router } from "express";
import {
  createUser,
  deleteUser,
  getallUser,
  updateUser,
} from "./user.controller";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserIdSchema,
} from "./user.schema";

export const user: Router = express.Router();

user
  .get("/", getallUser)
  .post("/", validateBody(CreateUserSchema), createUser)
  .put(
    "/:id",
    validateParams(UserIdSchema),
    validateBody(UpdateUserSchema),
    updateUser
  )
  .delete("/:id", validateParams(UserIdSchema), deleteUser);

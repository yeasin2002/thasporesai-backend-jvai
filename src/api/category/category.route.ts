import "./category.openapi";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import express, { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "./category.service";
import {
  CategoryIdSchema,
  CreateCategorySchema,
  SearchCategorySchema,
  UpdateCategorySchema,
} from "./category.validation";

export const category: Router = express.Router();

// Public routes (anyone can access)
category.get("/", validateQuery(SearchCategorySchema), getAllCategories);
category.get("/:id", validateParams(CategoryIdSchema), getCategoryById);

// Admin routes (TODO: Add requireRole('admin') middleware when auth is ready)
category.post("/", validateBody(CreateCategorySchema), createCategory);
category.put(
  "/:id",
  validateParams(CategoryIdSchema),
  validateBody(UpdateCategorySchema),
  updateCategory
);
category.delete("/:id", validateParams(CategoryIdSchema), deleteCategory);

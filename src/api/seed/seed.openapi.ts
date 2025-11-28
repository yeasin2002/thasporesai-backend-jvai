import { registry } from "@/lib/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// Response schemas
const SeedSuccessResponseSchema = z
  .object({
    status: z.number().openapi({ example: 201 }),
    message: z
      .string()
      .openapi({ example: "Successfully seeded 50 locations" }),
    data: z.array(z.any()),
    success: z.boolean().openapi({ example: true }),
  })
  .openapi("SeedSuccessResponse");

const SeedErrorResponseSchema = z
  .object({
    status: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Database already contains data" }),
    success: z.boolean().openapi({ example: false }),
  })
  .openapi("SeedErrorResponse");

// Register schemas
registry.register("SeedSuccessResponse", SeedSuccessResponseSchema);
registry.register("SeedErrorResponse", SeedErrorResponseSchema);

// POST /api/seed/locations - Seed locations
registry.registerPath({
  method: "post",
  path: "/api/seed/locations",
  description:
    "Seed database with top 50 US cities. Only works if location collection is empty.",
  summary: "Seed locations",
  tags: ["Seed - Development "],
  request: {},
  responses: {
    201: {
      description: "Locations seeded successfully",
      content: {
        "application/json": {
          schema: SeedSuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Database already contains locations",
      content: {
        "application/json": {
          schema: SeedErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: SeedErrorResponseSchema,
        },
      },
    },
  },
});

// POST /api/seed/users - Seed users
registry.registerPath({
  method: "post",
  path: "/api/seed/users",
  description:
    "Seed database with 3 test users (customer, contractor, admin). Only works if user collection is empty. All users have password: 123456",
  summary: "Seed users",
  tags: ["Seed - Development "],
  request: {},
  responses: {
    201: {
      description: "Users seeded successfully",
      content: {
        "application/json": {
          schema: SeedSuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Database already contains users",
      content: {
        "application/json": {
          schema: SeedErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: SeedErrorResponseSchema,
        },
      },
    },
  },
});

// POST /api/seed/categories - Seed categories
registry.registerPath({
  method: "post",
  path: "/api/seed/categories",
  description:
    "Seed database with 4 categories (Plumbing, Cleaning, Electrical, Carpentry). Only works if category collection is empty. Copies icon files to uploads folder.",
  summary: "Seed categories",
  tags: ["Seed - Development "],
  request: {},
  responses: {
    201: {
      description: "Categories seeded successfully",
      content: {
        "application/json": {
          schema: SeedSuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Database already contains categories",
      content: {
        "application/json": {
          schema: SeedErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: SeedErrorResponseSchema,
        },
      },
    },
  },
});

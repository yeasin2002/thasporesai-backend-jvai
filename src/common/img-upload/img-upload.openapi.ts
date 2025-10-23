import { registry } from "@/lib/openapi";
import {
  ErrorResponseSchema,
  ImageUploadResponseSchema,
} from "./img-upload.validation";

// Register schemas
registry.register("ImageUploadResponse", ImageUploadResponseSchema);
registry.register("ImageUploadErrorResponse", ErrorResponseSchema);

// POST /api/upload - Upload image
registry.registerPath({
  method: "post",
  path: "/api/upload",
  description: "Upload a single image file and get the URL",
  summary: "Upload image",
  tags: ["Image Upload"],
  requestBody: {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          properties: {
            image: {
              type: "string",
              format: "binary",
              description: "Image file to upload (max 5MB)",
            },
          },
          required: ["image"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Image uploaded successfully",
      content: {
        "application/json": {
          schema: ImageUploadResponseSchema,
        },
      },
    },
    400: {
      description: "No image file provided or invalid file type",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

import {
  mediaTypeFormat,
  openAPITags,
} from "@/common/constants/api-route-tags";
import { registry } from "@/lib/openapi";
import {
  ErrorResponseSchema,
  ImageKitAuthResponseSchema,
  ImageUploadResponseSchema,
} from "./img-upload.validation";

// Register schemas
registry.register("ImageUploadResponse", ImageUploadResponseSchema);
registry.register("ImageKitAuthResponse", ImageKitAuthResponseSchema);
registry.register("ImageUploadErrorResponse", ErrorResponseSchema);

// POST /api/common/upload - Upload image (server-side)
registry.registerPath({
  method: "post",
  path: openAPITags.common.imag_upload.basepath,
  description: "Upload a single image file to ImageKit via server",
  summary: "Upload image (server-side)",
  tags: [openAPITags.common.imag_upload.name],
  requestBody: {
    required: true,
    content: {
      [mediaTypeFormat.form]: {
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
      description: "Image uploaded successfully to ImageKit",
      content: {
        [mediaTypeFormat.json]: {
          schema: ImageUploadResponseSchema,
        },
      },
    },
    400: {
      description: "No image file provided or invalid file type",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// GET /api/common/upload/auth - Get ImageKit authentication parameters
registry.registerPath({
  method: "get",
  path: `${openAPITags.common.imag_upload.basepath}/auth`,
  description:
    "Get authentication parameters for client-side direct upload to ImageKit. Frontend uses these parameters to upload images directly to ImageKit without going through the server.",
  summary: "Get ImageKit auth parameters (client-side upload)",
  tags: [openAPITags.common.imag_upload.name],
  responses: {
    200: {
      description: "Authentication parameters generated successfully",
      content: {
        [mediaTypeFormat.json]: {
          schema: ImageKitAuthResponseSchema,
        },
      },
    },
    500: {
      description: "Failed to generate authentication parameters",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

import {
  mediaTypeFormat,
  openAPITags,
} from "@/common/constants/api-route-tags";
import { registry } from "@/lib/openapi";
import {
  CompleteDeliveryResponseSchema,
  CompleteDeliverySchema,
  ErrorResponseSchema,
} from "./delivery.validation";

// Register delivery schemas
registry.register("CompleteDelivery", CompleteDeliverySchema);
registry.register("CompleteDeliveryResponse", CompleteDeliveryResponseSchema);
registry.register("DeliveryErrorResponse", ErrorResponseSchema);

// POST /api/delivery/complete-delivery - Mark job as complete (Customer only)
registry.registerPath({
  method: "post",
  path: `${openAPITags.delivery.basepath}/complete-delivery`,
  description:
    "Customer marks a job as complete after contractor finishes work. This creates a completion request for admin approval. Admin will then approve the completion, which triggers payment release: 80% to contractor, 20% service fee to admin. Job must be in 'assigned' status with an accepted offer. Uses MongoDB transactions for atomicity.",
  summary: "Request job completion (requires admin approval)",
  tags: [openAPITags.delivery.name],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        [mediaTypeFormat.json]: {
          schema: CompleteDeliverySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description:
        "Completion request created successfully. Awaiting admin approval for payment release.",
      content: {
        [mediaTypeFormat.json]: {
          schema: CompleteDeliveryResponseSchema,
          example: {
            status: 200,
            message: "Completion request created successfully",
            data: {
              completionRequest: {
                _id: "673d5f8e9a1b2c3d4e5f6789",
                job: "673d5f8e9a1b2c3d4e5f6788",
                customer: "673d5f8e9a1b2c3d4e5f6787",
                contractor: "673d5f8e9a1b2c3d4e5f6786",
                offer: "673d5f8e9a1b2c3d4e5f6785",
                status: "pending",
                requestedAt: "2025-11-28T10:30:00.000Z",
              },
              job: {
                _id: "673d5f8e9a1b2c3d4e5f6788",
                title: "Fix Plumbing",
                status: "assigned",
                completedAt: "2025-11-28T10:30:00.000Z",
              },
              payment: {
                jobAmount: 100,
                serviceFee: 20,
                contractorPayout: 80,
                platformFee: 5,
                totalAdminCommission: 25,
              },
              message:
                "Completion request submitted. Admin will review and approve payment release.",
            },
          },
        },
      },
    },
    400: {
      description:
        "Bad request - Job not assigned, no accepted offer, or completion request already exists",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
          examples: {
            notAssigned: {
              value: {
                status: 400,
                message:
                  "Cannot complete job with status: open. Job must be assigned.",
                data: null,
              },
            },
            alreadyRequested: {
              value: {
                status: 400,
                message: "Completion request already exists for this job",
                data: null,
              },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized - Authentication required",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
          example: {
            status: 401,
            message: "User ID not found",
            data: null,
          },
        },
      },
    },
    403: {
      description:
        "Forbidden - Only customer who posted the job can request completion",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
          example: {
            status: 403,
            message: "You can only complete your own jobs",
            data: null,
          },
        },
      },
    },
    404: {
      description: "Not found - Job or offer not found",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
          examples: {
            jobNotFound: {
              value: {
                status: 404,
                message: "Job not found",
                data: null,
              },
            },
            noOffer: {
              value: {
                status: 404,
                message:
                  "No accepted offer found for this job. Cannot complete job without an accepted offer.",
                data: null,
              },
            },
          },
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
          example: {
            status: 500,
            message: "Failed to create completion request",
            data: null,
          },
        },
      },
    },
  },
});

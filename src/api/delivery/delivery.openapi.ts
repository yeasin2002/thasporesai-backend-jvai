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
    "Customer marks a job as complete after contractor finishes work. This triggers payment release from escrow: 80% to contractor, 20% service fee to admin. Job must be in 'in_progress' status with an accepted offer. Creates transaction records for audit trail and sends notification to contractor. Uses MongoDB transactions for atomicity.",
  summary: "Mark job as complete and release payment",
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
        "Job marked as complete successfully. Payment released to contractor and admin.",
      content: {
        [mediaTypeFormat.json]: {
          schema: CompleteDeliveryResponseSchema,
          example: {
            status: 200,
            message: "Job marked as complete successfully",
            data: {
              job: {
                _id: "673d5f8e9a1b2c3d4e5f6789",
                title: "Fix Plumbing",
                status: "completed",
                completedAt: "2025-11-28T10:30:00.000Z",
              },
              payment: {
                jobAmount: 100,
                serviceFee: 20,
                contractorPayout: 80,
                platformFee: 5,
                totalAdminCommission: 25,
              },
              wallets: {
                customer: {
                  balance: 0,
                  escrowBalance: 0,
                },
                contractor: {
                  balance: 80,
                  totalEarnings: 80,
                },
              },
              message:
                "Job completed successfully. Contractor received 80 (80% of 100). Service fee of 20 (20%) was deducted.",
            },
          },
        },
      },
    },
    400: {
      description:
        "Bad request - Job not in_progress, no accepted offer, or insufficient escrow balance",
      content: {
        [mediaTypeFormat.json]: {
          schema: ErrorResponseSchema,
          examples: {
            notInProgress: {
              value: {
                status: 400,
                message:
                  "Cannot complete job with status: open. Job must be in_progress.",
                data: null,
              },
            },
            insufficientEscrow: {
              value: {
                status: 400,
                message:
                  "Insufficient escrow balance. Required: 100, Available: 50",
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
        "Forbidden - Only customer who posted the job can complete it",
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
      description: "Not found - Job, offer, or wallet not found",
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
            message: "Failed to mark job as complete",
            data: null,
          },
        },
      },
    },
  },
});

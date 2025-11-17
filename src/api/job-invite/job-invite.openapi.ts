import { openAPITags } from "@/common/constants";
import { registry } from "@/lib/openapi";
import {
  ErrorResponseSchema,
  InviteIdParamSchema,
  InviteResponseSchema,
  InvitesResponseSchema,
  JobIdParamSchema,
  RejectInviteSchema,
  SearchAvailableContractorsSchema,
  SearchReceivedInvitesSchema,
  SearchSentInvitesSchema,
  SendInviteSchema,
  SuccessResponseSchema,
} from "./job-invite.validation";

// Register schemas
registry.register("SendInvite", SendInviteSchema);
registry.register("RejectInvite", RejectInviteSchema);
registry.register("JobIdParam", JobIdParamSchema);
registry.register("InviteIdParam", InviteIdParamSchema);
registry.register("SearchSentInvites", SearchSentInvitesSchema);
registry.register("SearchReceivedInvites", SearchReceivedInvitesSchema);
registry.register(
  "SearchAvailableContractors",
  SearchAvailableContractorsSchema
);
registry.register("InviteResponse", InviteResponseSchema);
registry.register("InvitesResponse", InvitesResponseSchema);
registry.register("JobInviteSuccessResponse", SuccessResponseSchema);
registry.register("JobInviteErrorResponse", ErrorResponseSchema);

// POST /api/job-invite/send/:jobId - Send invite to contractor
registry.registerPath({
  method: "post",
  path: `${openAPITags.job_invite.basepath}/send/{jobId}`,
  description:
    "Customer sends a job invite to a specific contractor. Only one invite per contractor per job is allowed. Note: Customers can invite contractors even if they have already applied to the job.",
  summary: "Send job invite",
  tags: [openAPITags.job_invite.name],
  security: [{ bearerAuth: [] }],
  request: {
    params: JobIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: SendInviteSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Invite sent successfully",
      content: {
        "application/json": {
          schema: InviteResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - already invited or job not open",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - not job owner",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Job or contractor not found",
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

// GET /api/job-invite/available/:jobId - Get available contractors
registry.registerPath({
  method: "get",
  path: `${openAPITags.job_invite.basepath}/available/{jobId}`,
  description:
    "Get contractors who are available to be invited for a specific job. Returns only contractors who have NOT applied to the job and have NOT been invited yet. Supports search and filtering by category, location, and budget.",
  summary: "Get available contractors",
  tags: [openAPITags.job_invite.name],
  security: [{ bearerAuth: [] }],
  request: {
    params: JobIdParamSchema,
    query: SearchAvailableContractorsSchema,
  },
  responses: {
    200: {
      description:
        "Available contractors retrieved successfully with pagination and exclusion information",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: { type: "number", example: 200 },
              message: {
                type: "string",
                example: "Available contractors retrieved successfully",
              },
              data: {
                type: "object",
                properties: {
                  contractors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        full_name: { type: "string" },
                        email: { type: "string" },
                        profile_img: { type: "string" },
                        bio: { type: "string" },
                        skills: { type: "array", items: { type: "string" } },
                        starting_budget: { type: "number" },
                        hourly_charge: { type: "number" },
                        category: { type: "array" },
                        location: { type: "object" },
                      },
                    },
                  },
                  total: {
                    type: "number",
                    description: "Total available contractors",
                  },
                  page: { type: "number", description: "Current page" },
                  limit: { type: "number", description: "Items per page" },
                  totalPages: {
                    type: "number",
                    description: "Total pages",
                  },
                  excludedCount: {
                    type: "number",
                    description:
                      "Number of contractors excluded (already applied or invited)",
                  },
                  jobInfo: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      budget: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - not job owner",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Job not found",
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

// GET /api/job-invite/sent - Get customer's sent invites
registry.registerPath({
	method: "get",
	path: `${openAPITags.job_invite.basepath}/sent`,
	description:
		"Get all invites sent by the customer with optional filtering by job and status. Supports pagination.",
	summary: "Get sent invites",
	tags: [openAPITags.job_invite.name],
	security: [{ bearerAuth: [] }],
	request: {
		query: SearchSentInvitesSchema,
	},
	responses: {
		200: {
			description: "Invites retrieved successfully with pagination information",
			content: {
				"application/json": {
					schema: InvitesResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
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

// GET /api/job-invite/received - Get contractor's received invites
registry.registerPath({
	method: "get",
	path: `${openAPITags.job_invite.basepath}/received`,
	description:
		"Get all invites received by the contractor with optional filtering by status. Supports pagination.",
	summary: "Get received invites",
	tags: [openAPITags.job_invite.name],
	security: [{ bearerAuth: [] }],
	request: {
		query: SearchReceivedInvitesSchema,
	},
	responses: {
		200: {
			description: "Invites retrieved successfully with pagination information",
			content: {
				"application/json": {
					schema: InvitesResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
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

// GET /api/job-invite/:inviteId - Get single invite details
registry.registerPath({
	method: "get",
	path: `${openAPITags.job_invite.basepath}/{inviteId}`,
	description:
		"Get details of a specific invite. Accessible by both customer and contractor involved.",
	summary: "Get invite details",
	tags: [openAPITags.job_invite.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: InviteIdParamSchema,
	},
	responses: {
		200: {
			description: "Invite details retrieved successfully",
			content: {
				"application/json": {
					schema: InviteResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - not involved in this invite",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Invite not found",
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

// PATCH /api/job-invite/:inviteId/accept - Accept invite
registry.registerPath({
	method: "patch",
	path: `${openAPITags.job_invite.basepath}/{inviteId}/accept`,
	description:
		"Contractor accepts a job invite. Creates a conversation for chat and updates job status.",
	summary: "Accept invite",
	tags: [openAPITags.job_invite.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: InviteIdParamSchema,
	},
	responses: {
		200: {
			description: "Invite accepted successfully",
			content: {
				"application/json": {
					schema: InviteResponseSchema,
				},
			},
		},
		400: {
			description: "Invite already processed or job not available",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - not the invited contractor",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Invite not found",
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

// PATCH /api/job-invite/:inviteId/reject - Reject invite
registry.registerPath({
	method: "patch",
	path: `${openAPITags.job_invite.basepath}/{inviteId}/reject`,
	description:
		"Contractor rejects a job invite with optional reason. Notifies the customer.",
	summary: "Reject invite",
	tags: [openAPITags.job_invite.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: InviteIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: RejectInviteSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Invite rejected successfully",
			content: {
				"application/json": {
					schema: InviteResponseSchema,
				},
			},
		},
		400: {
			description: "Invite already processed",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - not the invited contractor",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Invite not found",
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

// DELETE /api/job-invite/:inviteId - Cancel invite
registry.registerPath({
	method: "delete",
	path: `${openAPITags.job_invite.basepath}/{inviteId}`,
	description:
		"Customer cancels a sent invite. Only pending invites can be cancelled.",
	summary: "Cancel invite",
	tags: [openAPITags.job_invite.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: InviteIdParamSchema,
	},
	responses: {
		200: {
			description: "Invite cancelled successfully",
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
		},
		400: {
			description: "Cannot cancel processed invite",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - not the invite sender",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Invite not found",
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

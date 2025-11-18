import "./job-invite.openapi";

import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import {
	validateBody,
	validateParams,
	validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
	InviteIdParamSchema,
	JobIdParamSchema,
	RejectInviteSchema,
	SearchAvailableContractorsSchema,
	SearchReceivedInvitesSchema,
	SearchSentInvitesSchema,
	SendInviteSchema,
} from "./job-invite.validation";
import {
	acceptInvite,
	cancelInvite,
	getAvailableContractors,
	getInvite,
	getReceivedInvites,
	getSentInvites,
	rejectInvite,
	sendInvite,
} from "./services";

export const jobInvite: Router = express.Router();

// Customer routes
// Get available contractors for a job (who haven't applied or been invited)
jobInvite.get(
	"/available/:jobId",
	requireAuth,
	requireRole("customer"),
	validateParams(JobIdParamSchema),
	validateQuery(SearchAvailableContractorsSchema),
	getAvailableContractors,
);

// Send invite to contractor
jobInvite.post(
	"/send/:jobId",
	requireAuth,
	requireRole("customer"),
	validateParams(JobIdParamSchema),
	validateBody(SendInviteSchema),
	sendInvite,
);

// Get customer's sent invites
jobInvite.get(
	"/sent",
	requireAuth,
	requireRole("customer"),
	validateQuery(SearchSentInvitesSchema),
	getSentInvites,
);

// Cancel sent invite
jobInvite.delete(
	"/:inviteId",
	requireAuth,
	requireRole("customer"),
	validateParams(InviteIdParamSchema),
	cancelInvite,
);

// Contractor routes
// Get contractor's received invites
jobInvite.get(
	"/received",
	requireAuth,
	requireRole("contractor"),
	validateQuery(SearchReceivedInvitesSchema),
	getReceivedInvites,
);

// Accept invite
jobInvite.patch(
	"/:inviteId/accept",
	requireAuth,
	requireRole("contractor"),
	validateParams(InviteIdParamSchema),
	acceptInvite,
);

// Reject invite
jobInvite.patch(
	"/:inviteId/reject",
	requireAuth,
	requireRole("contractor"),
	validateParams(InviteIdParamSchema),
	validateBody(RejectInviteSchema),
	rejectInvite,
);

// Shared routes (both customer and contractor)
// Get single invite details
jobInvite.get(
	"/:inviteId",
	requireAuth,
	validateParams(InviteIdParamSchema),
	getInvite,
);

import "./job-request.openapi";

import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import {
	validateBody,
	validateParams,
	validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
	ApplicationIdParamSchema,
	ApplyForJobSchema,
	JobIdParamSchema,
	OfferIdParamSchema,
	RejectOfferSchema,
	SearchCustomerApplicationsSchema,
	SearchMyApplicationsSchema,
	SendOfferSchema,
} from "./job-request.validation";
import {
	acceptApplication,
	acceptOfferService,
	applyForJob,
	cancelApplication,
	getCustomerApplications,
	getJobApplications,
	getMyApplications,
	rejectApplication,
	rejectOfferService,
	sendOffer,
} from "./services";

export const jobRequest: Router = express.Router();

// Contractor routes
// Apply for a job
jobRequest.post(
	"/apply/:jobId",
	requireAuth,
	requireRole("contractor"),
	validateParams(JobIdParamSchema),
	validateBody(ApplyForJobSchema),
	applyForJob,
);

// Get contractor's own applications
jobRequest.get(
	"/my",
	requireAuth,
	requireRole("contractor"),
	validateQuery(SearchMyApplicationsSchema),
	getMyApplications,
);

// Cancel own application
jobRequest.delete(
	"/:applicationId",
	requireAuth,
	requireRole("contractor"),
	validateParams(ApplicationIdParamSchema),
	cancelApplication,
);

// Customer routes
// Get all applications for customer's jobs (with optional job filter)
jobRequest.get(
	"/customer/all",
	requireAuth,
	requireRole("customer"),
	validateQuery(SearchCustomerApplicationsSchema),
	getCustomerApplications,
);

// Get all applications for a specific job
jobRequest.get(
	"/job/:jobId",
	requireAuth,
	requireRole("customer"),
	validateParams(JobIdParamSchema),
	getJobApplications,
);

// Accept an application
jobRequest.patch(
	"/:applicationId/accept",
	requireAuth,
	requireRole("customer"),
	validateParams(ApplicationIdParamSchema),
	acceptApplication,
);

// Reject an application
jobRequest.patch(
	"/:applicationId/reject",
	requireAuth,
	requireRole("customer"),
	validateParams(ApplicationIdParamSchema),
	rejectApplication,
);

// ============================================
// OFFER ROUTES (Payment System)
// ============================================

// Customer sends offer to contractor
jobRequest.post(
	"/:applicationId/send-offer",
	requireAuth,
	requireRole("customer"),
	validateParams(ApplicationIdParamSchema),
	validateBody(SendOfferSchema),
	sendOffer,
);

// Contractor accepts offer
jobRequest.post(
	"/offer/:offerId/accept",
	requireAuth,
	requireRole("contractor"),
	validateParams(OfferIdParamSchema),
	acceptOfferService,
);

// Contractor rejects offer
jobRequest.post(
	"/offer/:offerId/reject",
	requireAuth,
	requireRole("contractor"),
	validateParams(OfferIdParamSchema),
	validateBody(RejectOfferSchema),
	rejectOfferService,
);

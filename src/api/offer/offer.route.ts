import "./offer.openapi";

import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import {
	validateBody,
	validateParams,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
	ApplicationIdParamSchema,
	CancelOfferSchema,
	InviteIdParamSchema,
	JobIdParamSchema,
	OfferIdParamSchema,
	RejectOfferSchema,
	SendDirectJobOfferSchema,
	SendOfferSchema,
} from "./offer.validation";
import {
	acceptOffer,
	cancelOffer,
	rejectOffer,
	sendJobOffer,
	sendOffer,
	sendOfferFromInvite,
} from "./services";

export const offer: Router = express.Router();

// ============================================
// OFFER ROUTES (Payment System)
// ============================================

// Customer sends offer to contractor (based on job application)
offer.post(
	"/application/:applicationId/send",
	requireAuth,
	requireRole("customer"),
	validateParams(ApplicationIdParamSchema),
	validateBody(SendOfferSchema),
	sendOffer,
);

// Customer sends offer to contractor (based on accepted job invite)
offer.post(
	"/invite/:inviteId/send",
	requireAuth,
	requireRole("customer"),
	validateParams(InviteIdParamSchema),
	validateBody(SendOfferSchema),
	sendOfferFromInvite,
);

// Customer sends direct offer to contractor (simplified flow via job ID)
offer.post(
	"/direct/:jobId/send",
	requireAuth,
	requireRole("customer"),
	validateParams(JobIdParamSchema),
	validateBody(SendDirectJobOfferSchema),
	sendJobOffer,
);

// Contractor accepts offer
offer.post(
	"/:offerId/accept",
	requireAuth,
	requireRole("contractor"),
	validateParams(OfferIdParamSchema),
	acceptOffer,
);

// Contractor rejects offer
offer.post(
	"/:offerId/reject",
	requireAuth,
	requireRole("contractor"),
	validateParams(OfferIdParamSchema),
	validateBody(RejectOfferSchema),
	rejectOffer,
);

// Customer cancels pending offer
offer.post(
	"/:offerId/cancel",
	requireAuth,
	requireRole("customer"),
	validateParams(OfferIdParamSchema),
	validateBody(CancelOfferSchema),
	cancelOffer,
);

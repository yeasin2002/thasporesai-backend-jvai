import "./offer.openapi";

import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import {
	validateBody,
	validateParams,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
	ApplicationIdParamSchema,
	OfferIdParamSchema,
	RejectOfferSchema,
	SendOfferSchema,
} from "./offer.validation";
import { acceptOffer, rejectOffer, sendOffer } from "./services";

export const offer: Router = express.Router();

// ============================================
// OFFER ROUTES (Payment System)
// ============================================

// Customer sends offer to contractor (based on application)
offer.post(
	"/:applicationId/send",
	requireAuth,
	requireRole("customer"),
	validateParams(ApplicationIdParamSchema),
	validateBody(SendOfferSchema),
	sendOffer,
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

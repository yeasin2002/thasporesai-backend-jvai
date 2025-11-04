import "./test-notification.openapi";

import { requireAuth, validateBody } from "@/middleware";
import express, { type Router } from "express";
import { sendTestNotification } from "./services";
import { TestNotificationSchema } from "./test-notification.validation";

export const testNotification: Router = express.Router();

// POST /api/test-notification - Send test notification
testNotification.post(
	"/",
	requireAuth,
	validateBody(TestNotificationSchema),
	sendTestNotification,
);

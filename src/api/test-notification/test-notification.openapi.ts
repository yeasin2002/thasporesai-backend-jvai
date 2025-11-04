import { mediaTypeFormat } from "@/common/constants";
import { registry } from "@/lib/openapi";
import {
	ErrorResponseSchema,
	TestNotificationResponseSchema,
	TestNotificationSchema,
} from "./test-notification.validation";

// Register schemas
registry.register("TestNotification", TestNotificationSchema);
registry.register("TestNotificationResponse", TestNotificationResponseSchema);
registry.register("ErrorResponse", ErrorResponseSchema);

// POST /api/test-notification - Send test notification
registry.registerPath({
	method: "post",
	path: "/api/test-notification",
	description:
		"Send a test push notification to a specific user for testing purposes",
	summary: "Send test notification",
	tags: ["Test Notification"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				[mediaTypeFormat.json]: {
					schema: TestNotificationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Test notification sent successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: TestNotificationResponseSchema,
				},
			},
		},
		400: {
			description: "Bad request - Invalid user ID or no active devices",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized - Invalid or missing token",
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

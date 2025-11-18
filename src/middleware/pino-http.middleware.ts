import { logger } from "@/lib/pino";
import pinoHttp from "pino-http";

/**
 * Pino HTTP middleware for automatic request/response logging
 * Logs all incoming requests with method, URL, status code, and response time
 */
export const pinoHttpMiddleware = pinoHttp({
	logger,
	autoLogging: true,
	customLogLevel: (_req, res, err) => {
		if (res.statusCode >= 500 || err) {
			return "error";
		}
		if (res.statusCode >= 400) {
			return "warn";
		}
		if (res.statusCode >= 300) {
			return "info";
		}
		return "info";
	},
	customSuccessMessage: (req, res) => {
		return `${req.method} ${req.url} ${res.statusCode}`;
	},
	customErrorMessage: (req, res, err) => {
		return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
	},
	customAttributeKeys: {
		req: "request",
		res: "response",
		err: "error",
		responseTime: "responseTime",
	},
	serializers: {
		req: (req) => ({
			id: req.id,
			method: req.method,
			url: req.url,
			query: req.query,
			params: req.params,
			headers: {
				host: req.headers.host,
				userAgent: req.headers["user-agent"],
				contentType: req.headers["content-type"],
			},
			remoteAddress: req.remoteAddress,
			remotePort: req.remotePort,
		}),
		res: (res) => ({
			statusCode: res.statusCode,
			headers: {
				contentType: res.getHeader("content-type"),
			},
		}),
		err: (err) => ({
			type: err.type,
			message: err.message,
			stack: err.stack,
		}),
	},
	// Custom properties to add to each log
	customProps: (req, _res) => ({
		body: (req as any).body,
		userId: (req as any).user?.id || (req as any).user?.userId,
		userEmail: (req as any).user?.email,
	}),
});

import path from "node:path";
import type { Logger } from "pino";
import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");

/**
 * Pino logger configuration with file rotation and pretty printing
 */
export const logger: Logger = pino({
	level: logLevel,
	timestamp: pino.stdTimeFunctions.isoTime,
	formatters: {
		level: (label) => {
			return { level: label.toUpperCase() };
		},
	},
	transport: isDevelopment
		? {
				// Development: Pretty print to console + file
				targets: [
					{
						target: "pino-pretty",
						level: logLevel,
						options: {
							colorize: true,
							translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
							ignore: "pid,hostname",
							singleLine: false,
							messageFormat: "{levelLabel} - {msg}",
						},
					},
					{
						target: "pino/file",
						level: "debug",
						options: {
							destination: path.join(logsDir, "app.log"),
							mkdir: true,
						},
					},
					{
						target: "pino/file",
						level: "error",
						options: {
							destination: path.join(logsDir, "error.log"),
							mkdir: true,
						},
					},
				],
			}
		: {
				// Production: JSON logs to files only
				targets: [
					{
						target: "pino/file",
						level: "info",
						options: {
							destination: path.join(logsDir, "app.log"),
							mkdir: true,
						},
					},
					{
						target: "pino/file",
						level: "error",
						options: {
							destination: path.join(logsDir, "error.log"),
							mkdir: true,
						},
					},
				],
			},
});

/**
 * Log HTTP request details
 */
export function logRequest(
	method: string,
	url: string,
	statusCode: number,
	responseTime: number,
	context?: Record<string, any>,
) {
	logger.info(
		{
			type: "http",
			method,
			url,
			statusCode,
			responseTime: `${responseTime}ms`,
			...context,
		},
		`${method} ${url} ${statusCode} - ${responseTime}ms`,
	);
}

/**
 * Log error with full context
 */
export function logError(
	message: string,
	error: Error | unknown,
	context?: Record<string, any>,
) {
	const errorObj = error instanceof Error ? error : new Error(String(error));

	logger.error(
		{
			type: "error",
			message,
			error: {
				name: errorObj.name,
				message: errorObj.message,
				stack: errorObj.stack,
			},
			...context,
		},
		message,
	);
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: Record<string, any>) {
	logger.info({ type: "info", ...context }, message);
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: Record<string, any>) {
	logger.warn({ type: "warning", ...context }, message);
}

/**
 * Log debug message (development only)
 */
export function logDebug(message: string, context?: Record<string, any>) {
	logger.debug({ type: "debug", ...context }, message);
}

/**
 * Log API response (success or error)
 */
export function logResponse(
	statusCode: number,
	message: string,
	context?: Record<string, any>,
) {
	const isError = statusCode >= 400;

	if (isError) {
		logger.error(
			{
				type: "response",
				statusCode,
				...context,
			},
			`[${statusCode}] ${message}`,
		);
	} else {
		logger.info(
			{
				type: "response",
				statusCode,
				...context,
			},
			`[${statusCode}] ${message}`,
		);
	}
}

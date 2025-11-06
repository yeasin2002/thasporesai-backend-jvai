import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// Base Certification Schema
export const CertificationSchema = z
	.object({
		_id: z.string().openapi({ description: "Certification ID" }),
		user: z.string().openapi({ description: "User ID" }),
		title: z.string().min(1).openapi({ description: "Certification title" }),
		img: z.string().openapi({ description: "Certification image URL" }),
		description: z
			.string()
			.optional()
			.openapi({ description: "Certification description" }),
		issue_date: z
			.string()
			.datetime()
			.optional()
			.openapi({ description: "Issue date" }),
		expiry_date: z
			.string()
			.datetime()
			.optional()
			.openapi({ description: "Expiry date" }),
		issuing_organization: z
			.string()
			.optional()
			.openapi({ description: "Issuing organization" }),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.openapi("Certification");

// Create Certification Schema
export const CreateCertificationSchema = CertificationSchema.omit({
	_id: true,
	user: true,
	createdAt: true,
	updatedAt: true,
}).openapi("CreateCertification");

// Update Certification Schema
export const UpdateCertificationSchema =
	CreateCertificationSchema.partial().openapi("UpdateCertification");

// Certification ID Param Schema
export const CertificationIdSchema = z
	.object({
		id: z.string().min(1).openapi({ description: "Certification ID" }),
	})
	.openapi("CertificationIdParam");

// Response Schemas
export const CertificationResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: CertificationSchema.nullable(),
		success: z.boolean(),
	})
	.openapi("CertificationResponse");

export const CertificationsResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.array(CertificationSchema),
		success: z.boolean(),
	})
	.openapi("CertificationsResponse");

export const ErrorResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null(),
		success: z.boolean(),
	})
	.openapi("CertificationErrorResponse");

// Types
export type Certification = z.infer<typeof CertificationSchema>;
export type CreateCertification = z.infer<typeof CreateCertificationSchema>;
export type UpdateCertification = z.infer<typeof UpdateCertificationSchema>;
export type CertificationIdParam = z.infer<typeof CertificationIdSchema>;

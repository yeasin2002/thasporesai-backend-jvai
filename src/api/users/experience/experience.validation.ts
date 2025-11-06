import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// Base Experience Schema
export const ExperienceSchema = z
	.object({
		_id: z.string().openapi({ description: "Experience ID" }),
		user: z.string().openapi({ description: "User ID" }),
		company_name: z.string().min(1).openapi({ description: "Company name" }),
		title: z.string().min(1).openapi({ description: "Job title" }),
		description: z.string().min(1).openapi({ description: "Job description" }),
		start_date: z
			.string()
			.datetime()
			.optional()
			.openapi({ description: "Start date" }),
		end_date: z
			.string()
			.datetime()
			.optional()
			.openapi({ description: "End date (optional for current job)" }),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.openapi("Experience");

// Create Experience Schema
export const CreateExperienceSchema = ExperienceSchema.omit({
	_id: true,
	user: true,
	createdAt: true,
	updatedAt: true,
}).openapi("CreateExperience");

// Update Experience Schema
export const UpdateExperienceSchema =
	CreateExperienceSchema.partial().openapi("UpdateExperience");

// Experience ID Param Schema
export const ExperienceIdSchema = z
	.object({
		id: z.string().min(1).openapi({ description: "Experience ID" }),
	})
	.openapi("ExperienceIdParam");

// Response Schemas
export const ExperienceResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: ExperienceSchema.nullable(),
		success: z.boolean(),
	})
	.openapi("ExperienceResponse");

export const ExperiencesResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.array(ExperienceSchema),
		success: z.boolean(),
	})
	.openapi("ExperiencesResponse");

export const ErrorResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null(),
		success: z.boolean(),
	})
	.openapi("ExperienceErrorResponse");

// Types
export type Experience = z.infer<typeof ExperienceSchema>;
export type CreateExperience = z.infer<typeof CreateExperienceSchema>;
export type UpdateExperience = z.infer<typeof UpdateExperienceSchema>;
export type ExperienceIdParam = z.infer<typeof ExperienceIdSchema>;

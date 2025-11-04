import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// Base WorkSample Schema
export const WorkSampleSchema = z
	.object({
		_id: z.string().openapi({ description: "Work sample ID" }),
		user: z.string().openapi({ description: "User ID" }),
		name: z.string().min(1).openapi({ description: "Work sample name" }),
		img: z.string().openapi({ description: "Work sample image URL" }),
		description: z
			.string()
			.optional()
			.openapi({ description: "Work sample description" }),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.openapi("WorkSample");

// Create WorkSample Schema
export const CreateWorkSampleSchema = WorkSampleSchema.omit({
	_id: true,
	user: true,
	createdAt: true,
	updatedAt: true,
}).openapi("CreateWorkSample");

// Update WorkSample Schema
export const UpdateWorkSampleSchema =
	CreateWorkSampleSchema.partial().openapi("UpdateWorkSample");

// WorkSample ID Param Schema
export const WorkSampleIdSchema = z
	.object({
		id: z.string().min(1).openapi({ description: "Work sample ID" }),
	})
	.openapi("WorkSampleIdParam");

// Response Schemas
export const WorkSampleResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: WorkSampleSchema.nullable(),
		success: z.boolean(),
	})
	.openapi("WorkSampleResponse");

export const WorkSamplesResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.array(WorkSampleSchema),
		success: z.boolean(),
	})
	.openapi("WorkSamplesResponse");

export const ErrorResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null(),
		success: z.boolean(),
	})
	.openapi("WorkSampleErrorResponse");

// Types
export type WorkSample = z.infer<typeof WorkSampleSchema>;
export type CreateWorkSample = z.infer<typeof CreateWorkSampleSchema>;
export type UpdateWorkSample = z.infer<typeof UpdateWorkSampleSchema>;
export type WorkSampleIdParam = z.infer<typeof WorkSampleIdSchema>;

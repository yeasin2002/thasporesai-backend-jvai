import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 400,
          message: "Validation failed",
          errors: error.issues.map((err: z.ZodIssue) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 400,
          message: "Invalid parameters",
          errors: error.issues.map((err: z.ZodIssue) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 400,
          message: "Invalid query parameters",
          errors: error.issues.map((err: z.ZodIssue) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
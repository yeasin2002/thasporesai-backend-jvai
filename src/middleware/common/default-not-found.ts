import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(
	_req: Request,
	res: Response,
	_next: NextFunction,
) {
	res.status(404).json({ data: null, error: "Not Found" });
}

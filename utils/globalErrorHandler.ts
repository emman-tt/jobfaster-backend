import { Request, Response, NextFunction } from "express";

export async function GlobalErrorHandler(
  req: Request,
  res: Response,
  err: any,
) {
  console.log(req);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
}

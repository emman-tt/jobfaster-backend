import { Request, Response, NextFunction } from "express";

export async function GlobalErrorHandler(
  req: Request,
  res: Response,
  err: any,
) {
  // console.error(`[ERROR] ${req.method} ${req.url}`);
  // console.error(`Message: ${err.message}`);
  // console.error(err.stack);
  console.log(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
}

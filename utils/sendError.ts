import { Response } from "express";
import { ErrorMessage } from "../constants/resMessages";

export function sendError(
  res: Response,
  message: ErrorMessage,
  statusCode: number,
  status: "failed" = "failed",
) {
  res.status(statusCode).json({
    message,
    status,
    timestamp: new Date().toISOString(),
  });
}

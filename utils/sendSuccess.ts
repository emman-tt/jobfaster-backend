import { Response } from "express";
import { SuccessMessage } from "../constants/resMessages";
export function sendSuccess<T>(
  res: Response,
  statusCode: number = 200,
  status: "success" = "success",
  message: SuccessMessage,
  data?: T,
) {
  res.status(statusCode).json({
    status: status,
    message: message,
    data: data ?? null,
    timestamp: new Date().toISOString(),
  });
}

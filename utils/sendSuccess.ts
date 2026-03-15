import { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  statusCode: 200 = 200,
  status: "success" = "success",
  message: string,
  data?: T,
) {
  return res.status(statusCode).json({
    status: status,
    message: message,
    data: data ?? null,
    timestamp: new Date().toISOString(),
  });
}

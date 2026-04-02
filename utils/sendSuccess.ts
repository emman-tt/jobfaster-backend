import { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  statusCode: number = 200,
  status: "success" = "success",
  message: string,
  data?: T,
) {
   res.status(statusCode).json({
    status: status,
    message: message,
    data: data ?? null,
    timestamp: new Date().toISOString(),
  });
}

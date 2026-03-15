import { Response } from "express";

export async function sendError(
  res: Response,
  message: string,
  statusCode: number,
  status: string,
) {
  return res.status(statusCode).json({
    status: status,
    message: message,
    timestamp: new Date().toISOString(),
  });
}

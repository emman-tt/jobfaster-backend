import { Response } from "express";
import { SuccessMessage } from "../constants/resMessages";
export function sendSuccess<T>(
  res: Response,
  statusCode?: number,
  status?: "success",
  message?: SuccessMessage,
  data?: T,
) {
  res.status(statusCode ?? 200).json({
    status: status ?? "success",
    message: message ?? "FETCH_SUCCESS",
    data: data ?? null,
    timestamp: new Date().toISOString(),
  });
}

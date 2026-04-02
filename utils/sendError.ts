import { Response } from "express";

interface errorData {
  statusCode: number;
  message: string;
  timestamp: string;
  status: string;
  res: any;
}
export function sendError(
  res: Response,
  message: string,
  statusCode: number,
  status: "failed" = "failed",
) {
  // const errorResponse: errorData = {
  //   statusCode: statusCode,
  //   message: message,
  //   timestamp: new Date().toISOString(),
  //   status: status,
  //   res: res,
  // };
  res.status(statusCode).json({
    message,
    status,
    timestamp: new Date().toISOString(),
  });
}

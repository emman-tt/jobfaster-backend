import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/sendError";
import dotenv from "dotenv";
dotenv.config();

export interface userPayload {
  sub: string;
  role: string;
  email: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return sendError(res, "Unauthorized: No token provided", 401, "failed");
    }
    if (!process.env.ACCESS_SECRET) {
      throw new Error("Access secret dont exist / wasnt provided");
    }

    jwt.verify(
      accessToken,
      process.env.ACCESS_SECRET,
      (err: any, decoded: any) => {
        if (err?.name === "TokenExpiredError") {
          return sendError(res, "ACCESS_TOKEN_EXPIRED", 401, "failed");
        }

        req.user = decoded;
        next();
      },
    );
  } catch (error) {
    next(error);
  }
}

export function RefreshAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshSecret = process.env.REFRESH_SECRET;
    const refreshToken: string = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendError(res, "Unauthorized, no token provided", 401, "failed");
    }

    if (!refreshSecret) throw new Error("Refresh secret was not provided");

    jwt.verify(refreshToken, refreshSecret, (err, payload) => {
      if (err) {
        return sendError(
          res,
          "Invalid refresh token , session expired",
          401,
          "failed",
        );
      }

      if (!process.env.ACCESS_SECRET) {
        throw new Error("Access token wasnt provided");
      }

      const accessToken = jwt.sign(
        payload as userPayload,
        process.env.ACCESS_SECRET,
      );

      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 15,
        secure: process.env.DEVELOPMENT == "production",
        httpOnly: true,
      });

      return res.status(201).json({
        status: "success",
        message: "User is authenticated",
      });
    });
  } catch (error) {
    next(error);
  }
}

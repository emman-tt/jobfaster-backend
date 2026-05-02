import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/sendError";
import { sendSuccess } from "../utils/sendSuccess";
import dotenv from "dotenv";
dotenv.config();
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { Token } from "../models/token";

export interface userPayload {
  sub: string;
  role: string;
  email?: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken) {
      return sendError(res, "NO_TOKEN", 401, "failed");
    }
    if (!process.env.ACCESS_SECRET) {
      throw new Error("Access secret dont exist / wasnt provided");
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET);
    (req as any).user = decoded as userPayload;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, "ACCESS_TOKEN_EXPIRED", 401, "failed");
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(res, "TOKEN_INVALID", 401, "failed");
    }
    next(error);
  }
}

export async function RefreshAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshSecret = process.env.REFRESH_SECRET;
    const accessSecret = process.env.ACCESS_SECRET;
    const refreshToken: string = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendError(res, "TOKEN_INVALID", 401, "failed");
    }

    if (!refreshSecret || !accessSecret)
      throw new Error("Token secret was not provided");

    let decodedPaylod: any;
    try {
      decodedPaylod = jwt.verify(refreshToken, refreshSecret);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        await Token.destroy({
          where: {
            token: refreshToken,
          },
        });
        return sendError(res, "REFRESH_TOKEN_EXPIRED", 401, "failed");
      }
      return sendError(res, "TOKEN_INVALID", 401, "failed");
    }

    const userId = decodedPaylod?.sub;
    const parser = new UAParser();
    const ua = parser.setUA(req.headers["user-agent"] as any).getResult();

    const tokenRecord = await Token.findOne({
      where: {
        userId: userId,
        token: refreshToken,
      },
    });

    if (!tokenRecord) {
      res.clearCookie("refreshToken");
      const existingTokens = await Token.count({ where: { userId } });
      if (existingTokens > 0) {
        console.error(
          "security alert - token not found but user has tokens, possible theft attempt",
        );
        await Token.destroy({
          where: {
            userId: userId,
          },
        });
      }
      return sendError(res, "TOKEN_INVALID", 401, "failed");
    }

    await tokenRecord.update({
      lastUsed: new Date(),
    });

    const accessToken = jwt.sign(
      {
        sub: decodedPaylod.sub,
        role: decodedPaylod.role,
      },
      accessSecret,
      {
        expiresIn: "15m",
      },
    );

    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 15,
      secure: process.env.DEVELOPMENT == "production",
      httpOnly: true,
    });

    return sendSuccess(
      res,
      undefined,
      "success",
      "REFRESH_SUCCESS",
      accessToken,
    );
  } catch (error) {
    next(error);
  }
}

interface FingerPrinting {
  deviceName: string;
  devicePrint: string;
}

function fingerPrint(ua: any): FingerPrinting {
  const browser = ua.browser.name || "Browser";
  const os = ua.os.name || "OS";
  const device = `${browser} on ${os}`;

  const fingerPrintString = `${browser}|${os}`;
  const fingerPrintHash = crypto
    .createHash("sha256")
    .update(fingerPrintString)
    .digest("hex");

  return {
    deviceName: device,
    devicePrint: fingerPrintHash,
  };
}

import { NextFunction, Request, Response } from "express";
import { sendError } from "../../utils/sendError";
import { User } from "../../models/user";
import bcrypt from "bcrypt";
import { sendSuccess } from "../../utils/sendSuccess";
import { generateToken } from "../../services/jwt";
import dotenv from "dotenv";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { Token } from "../../models/token";

dotenv.config();
const { DEVELOPMENT } = process.env;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password, name } = req.body;

    const userExists = await User.count({
      where: {
        email: email,
      },
    });

    if (userExists) {
      return sendError(res, "USER_EXISTS", 401, "failed");
    }

    const hashedPassword = await hashPassword(password);
    const parser = new UAParser();
    const ua = parser.setUA(req.headers["user-agent"] as any).getResult();
    const { deviceName, devicePrint } = fingerPrint(ua);

    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await generateToken(
      user.dataValues.id,
      "user",
    );

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12 * 7);

    await Token.create({
      userId: user.dataValues.id,
      deviceName: deviceName,
      devicePrint: devicePrint,
      token: refreshToken,
      lastUsed: new Date(),
      expiresAt: expiresAt,
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 12 * 7,
      secure: DEVELOPMENT == "production",
      httpOnly: true,
      sameSite: "lax",
    });
    return sendSuccess(
      res,
      undefined,
      undefined,
      "REGISTER_SUCCESS",
      accessToken,
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
}
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      return sendError(res, "INVALID_CREDENTIALS", 401, "failed");
    }

    const isPassword = await bcrypt.compare(password, user.dataValues.password);
    if (!isPassword) {
      return sendError(res, "INVALID_CREDENTIALS", 401, "failed");
    }

    const parser = new UAParser();
    const ua = parser.setUA(req.headers["user-agent"] as any).getResult();

    const { accessToken, refreshToken } = await generateToken(
      user.dataValues.id,
      "user",
    );

    const { deviceName, devicePrint } = fingerPrint(ua);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12 * 7);

    const existingToken = await Token.findOne({
      where: {
        userId: user.dataValues.id,
        devicePrint: devicePrint,
      },
    });

    if (existingToken) {
      await existingToken.update({
        token: refreshToken,
        lastUsed: new Date(),
        expiresAt: expiresAt,
      });
    } else {
      await Token.create({
        userId: user.dataValues.id,
        deviceName: deviceName,
        devicePrint: devicePrint,
        lastUsed: new Date(),
        token: refreshToken,
        expiresAt: expiresAt,
      });
    }

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 12 * 7,
      secure: DEVELOPMENT == "production",
      httpOnly: true,
      sameSite: "lax",
    });

    return sendSuccess(res, undefined, undefined, "LOGIN_SUCCESS", accessToken);
  } catch (error) {
    console.log(error);
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

async function hashPassword(password: string): Promise<string> {
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await Token.destroy({
        where: {
          token: refreshToken,
        },
      });
    }

    res.clearCookie("refreshToken");

    return sendSuccess(res, undefined, "success", "LOGOUT_SUCCESS");
  } catch (error) {
    console.error("Logout error:", error);
    next(error);
  }
}

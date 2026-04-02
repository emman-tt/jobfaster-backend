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
import { sequelize } from "../../database/pool";

dotenv.config();
const { DEVELOPMENT } = process.env;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();

  try {
    const { email, password, name } = req.body;

    const userExists = await User.findOne({
      where: {
        email: email,
      },
    });

    if (userExists) {
      return sendError(res, "ACCOUNT_EXISTS", 401, "failed");
    }

    const hashedPassword = await hashPassword(password);
    const parser = new UAParser();
    const ua = parser.setUA(req.headers["user-agent"] as any).getResult();

    const { accessToken, refreshToken } = await generateToken(email, "user");
    const { deviceName, devicePrint } = fingerPrint(ua);

    const user = await User.create(
      {
        name: name,
        email: email,
        password: hashedPassword,
      },
      {
        transaction: t,
      },
    );

    await Token.create(
      {
        userId: user.dataValues.id,
        deviceName: deviceName,
        devicePrint: devicePrint,
      },
      {
        transaction: t,
      },
    );

    await t.commit();

    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 15,
      secure: DEVELOPMENT == "production",
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 12 * 7,
      secure: DEVELOPMENT == "production",
      httpOnly: true,
    });
    return sendSuccess(
      res,
      undefined,
      undefined,
      "ACCOUNT_CREATED_SUCCESSFULLY",
    );
  } catch (error) {
    t.rollback();
    console.log(error);
    next(error);
  }
}
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const hashedPassword = await hashPassword(password);

    const user = await User.findOne({
      where: {
        email: email,
        password: hashedPassword,
      },
    });

    if (!user) {
      return sendError(res, "Invalid user credentials", 401, "failed");
    }
    const parser = new UAParser();
    const ua = parser.setUA(req.headers["user-agent"] as any).getResult();

    const { accessToken, refreshToken } = await generateToken(email, "user");

    fingerPrint(ua);
    return sendSuccess(
      res,
      undefined,
      undefined,
      "User logged in successfully",
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

async function hashPassword(password: string): Promise<string> {
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
}

import { NextFunction, Request, Response } from "express";
import { sendError } from "../../utils/sendError";
import { User } from "../../models/user";
import bcrypt from "bcrypt";
import { sendSuccess } from "../../utils/sendSuccess";
import { generateToken } from "../../services/jwt";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { Token } from "../../models/token";
import { sequelize } from "../../database/pool";
import { Sequelize } from "sequelize";
import { Settings } from "../../models/settings";
import { assignFreePlan } from "../payment/payment";

import { auth as betterAuth } from "../../services/better-auth";

const { DEVELOPMENT } = process.env;

export async function handleBetterAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const cookieHeader = req.headers.cookie;

    const session = await betterAuth.api.getSession({
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });

    if (!session?.user) {
      return sendError(res, "NO_TOKEN", 401, "failed");
    }

    const user = await User.findByPk(session.user.id, {
      attributes: ["id", "email", "name", "image"],
    });

    if (!user) {
      return sendError(res, "USER_NOT_FOUND", 404, "failed");
    }

    const parser = new UAParser();
    const ua = parser.setUA(req.headers["user-agent"] as any).getResult();
    const { deviceName, devicePrint } = fingerPrint(ua);

    const { accessToken, refreshToken } = await generateToken(user.id, "user");

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12 * 7);

    const existingToken = await Token.findOne({
      where: {
        userId: user.id,
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
        userId: user.id,
        deviceName: deviceName,
        devicePrint: devicePrint,
        token: refreshToken,
        lastUsed: new Date(),
        expiresAt: expiresAt,
      });
    }

    const settingsExist = await Settings.findOne({
      where: {
        userId: user.id,
      },
    });

    if (!settingsExist) {
      await Settings.create({
        userId: user.id,
        aiTailoringComplete: false,
        jobEmailSendAlert: true,
        newJobsAlert: true,
      });
    }

    await assignFreePlan(user.id);

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 12 * 7,
      secure: DEVELOPMENT === "production",
      httpOnly: true,
      sameSite: "lax",
    });

    return sendSuccess(
      res,
      undefined,
      undefined,
      "REFRESH_SUCCESS",
      accessToken,
    );
  } catch (error) {
    next(error);
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();
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

    await Token.create(
      {
        userId: user.dataValues.id,
        deviceName: deviceName,
        devicePrint: devicePrint,
        token: refreshToken,
        lastUsed: new Date(),
        expiresAt: expiresAt,
      },
      {
        transaction: t,
      },
    );

    await Settings.create(
      {
        userId: user.dataValues.id,
        jobEmailSendAlert: true,
        newJobsAlert: true,
        aiTailoringComplete: false,
      },
      {
        transaction: t,
      },
    );

    await assignFreePlan(user.dataValues.id, { transaction: t });

    await t.commit();

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
    await t.rollback();
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

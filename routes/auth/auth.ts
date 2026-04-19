import { NextFunction, Request, Response } from "express";
import express from "express";
import { login, register } from "../../controllers/auth/auth";
import { body, validationResult } from "express-validator";
import { sendError } from "../../utils/sendError";
import { RefreshAuth } from "../../middleware/authenticate";
import { logout } from "../../controllers/auth/auth";
import { generateToken } from "../../services/jwt";
import { Token } from "../../models/token";
import { User } from "../../models/user";
import { auth as betterAuth } from "../../services/better-auth";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { sendSuccess } from "../../utils/sendSuccess";
import dotenv from "dotenv";

dotenv.config();
const { DEVELOPMENT } = process.env;

const router = express.Router();

const validateRegister = [
  body("name").notEmpty().withMessage("Name is  required "),
  body("email").notEmpty().isEmail().withMessage("Email is  required"),
  body("password").notEmpty().withMessage("Password is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];
const validateLogin = [
  body("email").notEmpty().isEmail().withMessage("Email is  required"),
  body("password").notEmpty().withMessage("Password is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: "failed", errors: errors.array() });
    }
    next();
  },
];

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", RefreshAuth);
router.post("/logout", logout);

function fingerPrint(ua: any) {
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

router.post("/oauth-to-jwt", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookieHeader = req.headers.cookie;
    
    const session = await betterAuth.api.getSession({
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });

    if (!session?.user) {
      return sendError(res, "NO_TOKEN", 401, "failed");
    }

    const user = await User.findByPk(session.user.id);
    
    if (!user) {
      return sendError(res, "USER_NOT_FOUND", 404, "failed");
    }

    const parser = new UAParser();
    const ua = parser.setUA(req.headers["user-agent"] as any).getResult();
    const { deviceName, devicePrint } = fingerPrint(ua);

    const { accessToken, refreshToken } = await generateToken(
      user.id,
      "user"
    );

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
      });
    } else {
      await Token.create({
        userId: user.id,
        deviceName: deviceName,
        devicePrint: devicePrint,
        token: refreshToken,
        lastUsed: new Date(),
      });
    }

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 12 * 7,
      secure: DEVELOPMENT === "production",
      httpOnly: true,
      sameSite: "lax",
    });

    return sendSuccess(res, undefined, undefined, "SUCCESS", accessToken);
  } catch (error) {
    console.error("OAuth to JWT error:", error);
    next(error);
  }
});

export const authRouter = router;

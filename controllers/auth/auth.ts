import { NextFunction, Request, Response } from "express";
import { sendError } from "../../utils/sendError";
import { User } from "../../models/user";
import bcrypt from "bcrypt";
import { sendSuccess } from "../../utils/sendSuccess";
import { generateToken } from "../../services/jwt";
import dotenv from "dotenv";

dotenv.config();
const { DEVELOPMENT } = process.env;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await hashPassword(password);

    await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });
    return sendSuccess(res, undefined, undefined, "User created successfully");
  } catch (error) {
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

    const { accessToken, refreshToken } = await generateToken(email, "user");

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
      "User logged in successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function hashPassword(password: string): Promise<string> {
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
}

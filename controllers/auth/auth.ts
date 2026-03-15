import { NextFunction, Request, Response } from "express";
import { sendError } from "../../utils/sendError";
import { User } from "../../models/user";
import bcrypt from "bcrypt";
import { sendSuccess } from "../../utils/sendSuccess";

interface userData {
  name: string;
  password: string;
  email: string;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password, fullname } = req.body;
    if (!email || !password || !fullname) {
      sendError(res, "Missing some  credentials", 422, "error");
    }

    const hashedPassword = await hashPassword(password);

    await User.create({
      name: fullname,
      email: email,
      password: hashedPassword,
    });
    sendSuccess(res, undefined, undefined, "User created successfully");
  } catch (error) {
    next(error);
  }
}

async function hashPassword(password: string): Promise<string> {
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
}

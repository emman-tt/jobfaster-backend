import { Request, Response, NextFunction } from "express";
import { User } from "../../models/user";
import { sendSuccess } from "../../utils/sendSuccess";

export async function getUserData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const user = await User.findByPk(userId, {
      attributes: ["name", "email", "emailVerified", "image"],
    });

    sendSuccess(res, undefined, undefined, "FETCH_SUCCESS", user);
  } catch (error) {
    next(error);
  }
}
export async function updateUserData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const inputBody = req.body;

    const allowedFields = ["name", "email", "image"];

    const updates: Record<string, string> = {};

    for (const field of allowedFields) {
      if (inputBody[field] !== undefined) {
        updates[field] = inputBody[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    console.log("finished body", updates);

    sendSuccess(res, undefined, undefined, "FETCH_SUCCESS", user);
  } catch (error) {
    next(error);
  }
}

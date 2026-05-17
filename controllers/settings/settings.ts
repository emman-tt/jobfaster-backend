import { Response, Request, NextFunction } from "express";
import { Settings } from "../../models/settings";
import { User } from "../../models/user";
import { sendSuccess } from "../../utils/sendSuccess";

export async function FetchSettingsData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const userSettings = await Settings.findOne({
      where: {
        userId: userId,
      },
      include: [
        {
          model: User,
          attributes: ["name", "email", "emailVerified", "image"],
        },
      ],
    });

    sendSuccess(res, undefined, undefined, "FETCH_SUCCESS", userSettings);
  } catch (error) {
    next(error);
  }
}

export async function UpdateNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const inputBody = req.body;

    const allowedFields = [
      "newJobsAlert",
      "aiTailoringComplete",
      "jobEmailSendAlert",
    ];

    const updates: Record<string, boolean> = {};

    for (const field of allowedFields) {
      if (inputBody[field] !== undefined) {
        updates[field] = inputBody[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await Settings.update(updates, {
      where: {
        userId: userId,
      },
    });

    sendSuccess(res, undefined, undefined, "UPDATE SUCCESS");
  } catch (error) {
    next(error);
  }
}

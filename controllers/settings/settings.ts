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

export async function UpdateSettings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;
  } catch (error) {
    next(error);
  }
}

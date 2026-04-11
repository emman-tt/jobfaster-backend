import { Response, Request, NextFunction } from "express";
import { Activity } from "../../models/activity";
import { sendSuccess } from "../../utils/sendSuccess";

export async function getActivity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const activities = await Activity.findAll({
      where: {
        userId: userId,
      },
      attributes: ["id", "type", "updatedAt", "message"],
    });

    sendSuccess(res, 200, "success", "FETCH_SUCCESS", activities || []);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

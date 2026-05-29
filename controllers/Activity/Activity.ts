import { Response, Request, NextFunction } from "express";
import { Activity } from "../../models/activity";
import { sendSuccess } from "../../utils/sendSuccess";
import { Op } from "sequelize";

export async function getActivity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const { rows: activities, count: total } = await Activity.findAndCountAll({
      where: {
        userId: userId,
      },
      attributes: ["id", "type", "updatedAt", "message"],
      order: [["updatedAt", "DESC"]],
      offset,
      limit,
    });

    sendSuccess(res, 200, "success", "FETCH_SUCCESS", {
      data: activities || [],
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    next(error);
  }
}

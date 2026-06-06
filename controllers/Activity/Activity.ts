import { Response, Request, NextFunction } from "express";
import { Activity } from "../../models/activity";
import { Subscription } from "../../models/subscription";
import { Plan } from "../../models/plans";
import { sendSuccess } from "../../utils/sendSuccess";
import { Op } from "sequelize";
import { getSubscriptionWithPlan, getPlan, getMaxActivityDays } from "../../services/planEnforcer";

export async function getActivity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub as string;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const subscription = await getSubscriptionWithPlan(userId);

    const whereClause: any = { userId };

    if (subscription) {
      const plan = getPlan(subscription);
      const maxDays = getMaxActivityDays(plan);
      const since = new Date();
      since.setDate(since.getDate() - maxDays);
      whereClause.createdAt = { [Op.gte]: since };
    }

    const { rows: activities, count: total } = await Activity.findAndCountAll({
      where: whereClause,
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

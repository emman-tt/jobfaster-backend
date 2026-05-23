import { Request, Response, NextFunction } from "express";
import { Plan } from "../../models/plans";
import { sendSuccess } from "../../utils/sendSuccess";

export async function getPlans(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      order: [["sortOrder", "ASC"]],
    });

    sendSuccess(res, 200, "success", "FETCH_SUCCESS", plans);
  } catch (error) {
    next(error);
  }
}

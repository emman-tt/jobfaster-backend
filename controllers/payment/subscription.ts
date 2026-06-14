import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/sendSuccess";
import { Plan } from "../../models/plans";
import { Subscription } from "../../models/subscription";
export async function getActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const subscription = await Subscription.findOne({
      where: { userId, isActive: true },
      include: [
        {
          model: Plan,
          attributes: [
            "name",
            "displayName",
            "variantId",
            "priceMonthly",
            "priceYearly",
            "maxResumeUploads",
            "maxApplicationsPerMonth",
            "maxStorageMb",
            "allowJobImageUploads",
            "allowAdvancedExports",
          ],
        },
      ],
    });

    sendSuccess(res, 200, "success", "FETCH_SUCCESS", subscription);
  } catch (error) {
    next(error);
  }
}



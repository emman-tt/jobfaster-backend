import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/sendSuccess";
import { Plan } from "../../models/plans";
import { Subscription } from "../../models/subscription";
import "dotenv/config";
import { lemonSqueezyConfig } from "../../services/payment";
import { sendError } from "../../utils/sendError";
import { VARIANTS } from "../../constants/variants";
import { logError } from "../../utils/logger";
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

export async function updateSubscriptionPlan(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const subscriptionId = req.body.subscriptionId;

    const variantKey = req.body?.variantKey as
      | "monthly_pro"
      | "monthly_premium";

    if (!variantKey) {
      return sendError(res, "INVALID_INPUT", 400);
    }

    const variantId = VARIANTS[variantKey];
    if (!variantId) {
      return sendError(res, "INVALID_VARIANT", 404);
    }
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
      {
        method: "PATCH",
        headers: lemonSqueezyConfig.getHeaders(),
        body: JSON.stringify({
          data: {
            type: "subscriptions",
            id: subscriptionId,
            attributes: {
              variant_id: variantId,
              invoice_immediately: true,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      logError(
        new Error(`Lemon Squeezy updating plan failed: ${response.status}`),
        {
          file: "payment.ts",
          function: "updateSubscriptionPlan",
          line: 85,
        },
      );
      return sendError(res, "CHECKOUT_FAILED", 500);
    }

    const checkoutUrl = data.data.attributes.url;

    res.status(200).json({
      status: "success",
      message: "CHECKOUT_CREATED",
      data: {
        checkoutUrl,
        variantKey,
      },
    });
  } catch (error) {
    next(error);
  }
}

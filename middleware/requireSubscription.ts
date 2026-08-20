import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/sendError";
import {
  getSubscriptionWithPlan,
  getPlan,
} from "../services/planEnforcer";

export function requireSubscription(feature?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.sub as string;
      if (!userId) {
        return sendError(res, "UNAUTHORIZED", 401, "failed");
      }

      const subscription = await getSubscriptionWithPlan(userId);

      if (!subscription || !subscription.isActive) {
        return sendError(res, "SUBSCRIPTION_REQUIRED", 403, "failed");
      }

      if (feature) {
        const plan = getPlan(subscription) as any;
        if (plan && !plan[feature]) {
          return sendError(res, "FEATURE_NOT_ALLOWED", 403, "failed");
        }
      }

      (req as any).subscription = subscription;
      next();
    } catch (error) {
      next(error);
    }
  };
}

import { WebSocket } from "ws";
import {
  getSubscriptionWithPlan,
  getPlan,
} from "./planEnforcer.js";
import { sendSocketError } from "../utils/sendSocketError.js";

export async function requireSocketSubscription(
  userId: string,
  ws: WebSocket,
  type: string,
  feature?: string,
): Promise<boolean> {
  const subscription = await getSubscriptionWithPlan(userId);

  if (!subscription || !subscription.isActive) {
    sendSocketError(
      ws,
      "SUBSCRIPTION_REQUIRED",
      "Active subscription required. Please upgrade your plan.",
      type,
    );
    return false;
  }

  if (feature) {
    const plan = getPlan(subscription) as any;
    if (plan && !plan[feature]) {
      sendSocketError(
        ws,
        "FEATURE_NOT_ALLOWED",
        `This feature requires a higher plan. Please upgrade.`,
        type,
      );
      return false;
    }
  }

  return true;
}

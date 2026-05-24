import crypto from "crypto";
import { Request, Response } from "express";
import "dotenv/config";
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionCancelled,
  handleSubscriptionExpired,
  handleSubscriptionResumed,
  handleSubscriptionPaymentSuccess,
} from "./payment";
import { logError, logInfo } from "../../utils/logger.js";

const { LEMON_SQUEEZY_WEBHOOK_SECRET } = process.env;

export async function handlePaymentWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-signature"];
    const eventName = req.headers["x-event-name"];
    const rawBody = req.body;
    const payload =
      typeof rawBody === "string" ? rawBody : rawBody.toString();

    if (!LEMON_SQUEEZY_WEBHOOK_SECRET) {
      logError(new Error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET in .env"), {
        file: "webhook.ts",
        function: "handlePaymentWebhook",
        line: 32,
      });
      return res
        .status(500)
        .json({ error: "Server configuration error: missing webhook secret" });
    }

    if (!signature) {
      logError(new Error("Missing x-signature header"), {
        file: "webhook.ts",
        function: "handlePaymentWebhook",
        line: 40,
      });
      return res.status(401).json({ error: "Missing signature header" });
    }

    const hash = crypto
      .createHmac("sha256", LEMON_SQUEEZY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signature as string),
    );

    if (!signatureValid) {
      logError(new Error("Invalid webhook signature"), {
        file: "webhook.ts",
        function: "handlePaymentWebhook",
        line: 58,
      });
      return res.status(401).json({ error: "Invalid signature" });
    }

    const webhook = JSON.parse(payload);
    const { custom_data } = webhook.meta || {};
    const userId = custom_data?.user_id;
    const variantKey = custom_data?.variant_key;

    if (!userId) {
      logError(new Error("No user_id in custom_data"), {
        file: "webhook.ts",
        function: "handlePaymentWebhook",
        line: 72,
      });
      return res.status(400).json({ error: "Missing user_id in webhook payload" });
    }

    switch (eventName) {
      case "subscription_created":
        logInfo("Webhook received", { event: "subscription_created", userId, variantKey });
        await handleSubscriptionCreated(webhook.data, userId, variantKey);
        break;
      case "subscription_updated":
        logInfo("Webhook received", { event: "subscription_updated", userId, variantKey });
        await handleSubscriptionUpdated(webhook.data, userId);
        break;
      case "subscription_cancelled":
        logInfo("Webhook received", { event: "subscription_cancelled", userId, variantKey });
        await handleSubscriptionCancelled(webhook.data, userId);
        break;
      case "subscription_expired":
        logInfo("Webhook received", { event: "subscription_expired", userId, variantKey });
        await handleSubscriptionExpired(webhook.data, userId);
        break;
      case "subscription_resumed":
        logInfo("Webhook received", { event: "subscription_resumed", userId, variantKey });
        await handleSubscriptionResumed(webhook.data, userId);
        break;
      case "subscription_payment_success":
        logInfo("Webhook received", { event: "subscription_payment_success", userId, variantKey });
        await handleSubscriptionPaymentSuccess(webhook.data, userId);
        break;
      case "order_created":
        logInfo("Webhook received", { event: "order_created", userId, variantKey });
        break;
      default:
        logInfo("Unhandled webhook event", { event: eventName, userId, variantKey });
    }

    res.status(200).json({ received: true, event: eventName });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      file: "webhook.ts",
      function: "handlePaymentWebhook",
      line: 110,
    });
    res.status(500).json({ error: "Internal server error", message: String(error) });
  }
}

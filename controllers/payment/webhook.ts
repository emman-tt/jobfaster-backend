import crypto from "crypto";
import { Request, Response } from "express";
import "dotenv/config";
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionCancelled,
  handleSubscriptionExpired,
  handleSubscriptionResumed,
} from "./payment";

const { LEMON_SQUEEZY_WEBHOOK_SECRET } = process.env;

export async function handlePaymentWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-signature"];
    const eventName = req.headers["x-event-name"];
    const rawBody = req.body;
    const payload =
      typeof rawBody === "string" ? rawBody : rawBody.toString();

    console.log("=== Webhook received ===");
    console.log("Event name:", eventName);
    console.log("Has signature:", !!signature);
    console.log("Has webhook secret:", !!LEMON_SQUEEZY_WEBHOOK_SECRET);

    if (!LEMON_SQUEEZY_WEBHOOK_SECRET) {
      console.error("ERROR: Missing LEMON_SQUEEZY_WEBHOOK_SECRET in .env");
      return res
        .status(500)
        .json({ error: "Server configuration error: missing webhook secret" });
    }

    if (!signature) {
      console.error("ERROR: Missing x-signature header");
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

    console.log("Signature valid:", signatureValid);
    console.log("Computed hash:", hash);
    console.log("Received signature:", signature);

    if (!signatureValid) {
      console.error("ERROR: Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const webhook = JSON.parse(payload);
    const { custom_data } = webhook.meta || {};
    const userId = custom_data?.user_id;
    const variantKey = custom_data?.variant_key;

    console.log("Custom data:", custom_data);
    console.log("User ID:", userId);
    console.log("Variant Key:", variantKey);

    if (!userId) {
      console.error("ERROR: No user_id in custom_data");
      return res.status(400).json({ error: "Missing user_id in webhook payload" });
    }

    switch (eventName) {
      case "subscription_created":
        console.log("Handling subscription_created...");
        await handleSubscriptionCreated(webhook.data, userId, variantKey);
        console.log("✅ subscription_created handled successfully");
        break;
      case "subscription_updated":
        console.log("Handling subscription_updated...");
        await handleSubscriptionUpdated(webhook.data, userId);
        console.log("✅ subscription_updated handled successfully");
        break;
      case "subscription_cancelled":
        console.log("Handling subscription_cancelled...");
        await handleSubscriptionCancelled(webhook.data, userId);
        console.log("✅ subscription_cancelled handled successfully");
        break;
      case "subscription_expired":
        console.log("Handling subscription_expired...");
        await handleSubscriptionExpired(webhook.data, userId);
        console.log("✅ subscription_expired handled successfully");
        break;
      case "subscription_resumed":
        console.log("Handling subscription_resumed...");
        await handleSubscriptionResumed(webhook.data, userId);
        console.log("✅ subscription_resumed handled successfully");
        break;
      default:
        console.log(`Unhandled webhook event: ${eventName}`);
    }

    res.status(200).json({ received: true, event: eventName });
  } catch (error) {
    console.error("🔥 Webhook error:", error);
    res.status(500).json({ error: "Internal server error", message: String(error) });
  }
}

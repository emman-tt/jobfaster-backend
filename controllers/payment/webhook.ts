import crypto from "crypto";
import { Request, Response } from "express";
import "dotenv/config";
const { LEMON_SQUEEZY_WEBHOOK_SECRET } = process.env;
export async function handlePaymentWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-signature"];
    const eventName = req.headers["x-event-name"];
    const payload = req.body.toString();

    const hash = crypto
      .createHmac("sha256", LEMON_SQUEEZY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const webhook = JSON.parse(payload);
    const { custom_data } = webhook.meta || {};
    const userId = custom_data?.user_id;

    if (!userId) {
      console.error("No user_id in custom_data");
      return res.status(400).json({ error: "Missing user_id" });
    }

    // 4. Handle event
    switch (eventName) {
      case "order_created":
        await handleOrderCreated(webhook.data, userId);
        break;
      // case "subscription_updated":
      //   await handleSubscriptionUpdated(webhook.data, userId);
      //   break;
      // case "subscription_cancelled":
      //   await handleSubscriptionCancelled(webhook.data, userId);
      //   break;
      // case "subscription_expired":
      //   await handleSubscriptionExpired(webhook.data, userId);
      //   break;
      // case "subscription_payment_failed":
      //   await handlePaymentFailed(webhook.data, userId);
      //   break;
      default:
        console.log(`Unhandled event: ${eventName}`);
    }

    // Must return 200 to acknowledge receipt[citation:3]
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal error" });
  }
}

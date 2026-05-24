import { Request, Response, NextFunction } from "express";
import { VARIANTS } from "../../constants/variants";
import { sendError } from "../../utils/sendError";
import { User } from "../../models/user";
import { Plan } from "../../models/plans";
import { Subscription } from "../../models/subscription";
import { lemonSqueezyConfig } from "../../services/payment";
import "dotenv/config";

const { LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_REDIRECT_URL } = process.env;

export async function CreateCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

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

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email"],
    });

    if (!user) {
      return sendError(res, "USER_NOT_FOUND", 404);
    }

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: lemonSqueezyConfig.getHeaders(),
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              name: user.name || undefined,
              custom: {
                user_id: user.id,
                variant_key: variantKey,
              },
            },
            product_options: {
              enabled_variants: [variantId],
              redirect_url: LEMON_SQUEEZY_REDIRECT_URL,
              receipt_button_text: "Return to JobFaster",
              receipt_thank_you_note: "Thanks for subscribing to JobFaster!",
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: LEMON_SQUEEZY_STORE_ID,
              },
            },
            variant: {
              data: {
                type: "variants",
                id: variantId,
              },
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Lemon Squeezy error:", data);
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

export async function getPlanByVariantKey(variantKey: string) {
  return await Plan.findOne({
    where: { variantId: variantKey },
  });
}

export async function handleSubscriptionCreated(
  data: any,
  userId: string,
  variantKey?: string,
) {
  try {
    const attributes = data.attributes || {};
    const subscriptionId = data.id;
    const status = attributes.status;
    const renewsAt = attributes.renews_at;
    const endsAt = attributes.ends_at;
    const trialEndsAt = attributes.trial_ends_at;
    const orderId = attributes.order_id;
    const cardBrand = attributes.card_brand;
    const cardLastFour = attributes.card_last_four;
    const updatePaymentMethodUrl = attributes.urls?.update_payment_method;

    let planId: string | null = null;

    if (variantKey) {
      const plan = await getPlanByVariantKey(variantKey);
      planId = plan?.id || null;
    }

    if (!planId) {
      const freePlan = await Plan.findOne({ where: { variantId: "free" } });
      planId = freePlan?.id || null;
    }

    if (!planId) {
      console.error("Could not determine plan for subscription");
      return;
    }

    const [subscription, created] = await Subscription.upsert(
      {
        userId,
        planId,
        lemonSqueezyId: String(subscriptionId),
        lemonSqueezyOrderId: orderId ? String(orderId) : null,
        isActive: status === "active" || status === "on_trial",
        status,
        startDate: new Date(),
        endDate: endsAt ? new Date(endsAt) : null,
        renewsAt: renewsAt ? new Date(renewsAt) : null,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
        cardBrand: cardBrand || null,
        cardLastFour: cardLastFour || null,
        updatePaymentMethodUrl: updatePaymentMethodUrl || null,
      },
      {
        conflictFields: ["lemon_squeezy_id"],
      },
    );

    console.log(
      `Subscription ${created ? "created" : "updated"} for user ${userId}`,
    );
  } catch (error) {
    console.error("Error handling subscription_created:", error);
  }
}

export async function handleSubscriptionUpdated(data: any, userId: string) {
  try {
    const attributes = data.attributes || {};
    const subscriptionId = data.id;
    const status = attributes.status;
    const renewsAt = attributes.renews_at;
    const endsAt = attributes.ends_at;
    const cardBrand = attributes.card_brand;
    const cardLastFour = attributes.card_last_four;
    const updatePaymentMethodUrl = attributes.urls?.update_payment_method;

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
    });

    if (!subscription) {
      console.log(`Subscription ${subscriptionId} not found, creating...`);
      await handleSubscriptionCreated(data, userId);
      return;
    }

    await subscription.update({
      isActive: status === "active" || status === "on_trial",
      status,
      renewsAt: renewsAt ? new Date(renewsAt) : null,
      endDate: endsAt ? new Date(endsAt) : null,
      cardBrand: cardBrand || undefined,
      cardLastFour: cardLastFour || undefined,
      updatePaymentMethodUrl: updatePaymentMethodUrl || undefined,
    });

    console.log(`Subscription ${subscriptionId} updated for user ${userId}`);
  } catch (error) {
    console.error("Error handling subscription_updated:", error);
  }
}

export async function handleSubscriptionCancelled(data: any, userId: string) {
  try {
    const attributes = data.attributes || {};
    const subscriptionId = data.id;
    const endsAt = attributes.ends_at;
    const cancelledAt = attributes.cancelled_at;
    const cancelReason = attributes.cancellation_reason;

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
    });

    if (subscription) {
      await subscription.update({
        isActive: false,
        endDate: endsAt ? new Date(endsAt) : null,
        cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
        cancelReason: cancelReason || null,
      });

      console.log(
        `Subscription ${subscriptionId} cancelled for user ${userId}`,
      );
    }
  } catch (error) {
    console.error("Error handling subscription_cancelled:", error);
  }
}

export async function handleSubscriptionExpired(data: any, userId: string) {
  try {
    const subscriptionId = data.id;

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
    });

    if (subscription) {
      await subscription.update({
        isActive: false,
      });

      console.log(`Subscription ${subscriptionId} expired for user ${userId}`);
    }
  } catch (error) {
    console.error("Error handling subscription_expired:", error);
  }
}

export async function handleSubscriptionResumed(data: any, userId: string) {
  try {
    const attributes = data.attributes || {};
    const subscriptionId = data.id;
    const renewsAt = attributes.renews_at;

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
    });

    if (subscription) {
      await subscription.update({
        isActive: true,
        renewsAt: renewsAt ? new Date(renewsAt) : null,
        cancelledAt: null,
        cancelReason: null,
      });

      console.log(`Subscription ${subscriptionId} resumed for user ${userId}`);
    }
  } catch (error) {
    console.error("Error handling subscription_resumed:", error);
  }
}

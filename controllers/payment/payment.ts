import { Request, Response, NextFunction } from "express";
import { VARIANTS } from "../../constants/variants";
import { sendError } from "../../utils/sendError";
import { logError, logInfo } from "../../utils/logger.js";
import { User } from "../../models/user";
import { Plan } from "../../models/plans";
import { Subscription } from "../../models/subscription";
import { Transaction } from "../../models/transaction";
import { sequelize } from "../../database/pool";
import {
  Transaction as SequelizeTransaction,
  UniqueConstraintError,
} from "sequelize";
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

    const plan = await Plan.findOne({
      where: { variantId: variantKey, isActive: true },
    });

    if (!plan) {
      return sendError(res, "INVALID_VARIANT", 404);
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email"],
    });

    if (!user) {
      return sendError(res, "USER_NOT_FOUND", 404);
    }

    const existingSub = await Subscription.findOne({
      where: { userId, isActive: true },
    });

    if (existingSub?.lemonSqueezyId) {
      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${existingSub.lemonSqueezyId}`,
        {
          method: "PATCH",
          headers: lemonSqueezyConfig.getHeaders(),
          body: JSON.stringify({
            data: {
              type: "subscriptions",
              id: existingSub.lemonSqueezyId,
              attributes: {
                variant_id: variantId,
                invoice_immediately: true,
              },
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        logError(
          new Error(`Lemon Squeezy plan update failed: ${response.status}`),
          {
            file: "payment.ts",
            function: "CreateCheckout",
            line: 72,
          },
        );
        return sendError(res, "UPDATE_FAILED", 500);
      }

      const updateUrl = data.data.attributes.urls?.update_payment_method;

      return res.status(200).json({
        status: "success",
        message: "SUBSCRIPTION_UPDATED",
        data: {
          updateUrl,
          variantKey,
        },
      });
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
      logError(new Error(`Lemon Squeezy checkout failed: ${response.status}`), {
        file: "payment.ts",
        function: "CreateCheckout",
        line: 88,
      });
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
  const transaction = await sequelize.transaction();

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
      const freePlan = await Plan.findOne({
        where: { variantId: "free" },
        transaction,
      });
      planId = freePlan?.id || null;
    }

    if (!planId) {
      await transaction.rollback();
      logError(new Error("Could not determine plan for subscription"), {
        file: "payment.ts",
        function: "handleSubscriptionCreated",
        line: 149,
      });
      return;
    }

    let subscription: InstanceType<typeof Subscription>;
    let created = false;

    const existingSubscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
      transaction,
    });

    if (existingSubscription) {
      await existingSubscription.update(
        {
          planId,
          lemonSqueezyOrderId: orderId ? String(orderId) : null,
          isActive: status === "active" || status === "on_trial",
          status,
          endDate: endsAt ? new Date(endsAt) : null,
          renewsAt: renewsAt ? new Date(renewsAt) : null,
          trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
          cardBrand: cardBrand || null,
          cardLastFour: cardLastFour || null,
          updatePaymentMethodUrl: updatePaymentMethodUrl || null,
        },
        { transaction },
      );
      subscription = existingSubscription;
    } else {
      const activeSub = await Subscription.findOne({
        where: { userId, isActive: true },
        transaction,
      });

      if (activeSub) {
        await activeSub.update(
          {
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
          { transaction },
        );
        subscription = activeSub;
      } else {
        subscription = await Subscription.create(
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
          { transaction },
        );
      }
      created = true;
    }

    await transaction.commit();

    logInfo("Subscription processed", {
      action: created ? "created" : "updated",
      userId,
      subscriptionId,
    });
  } catch (error) {
    await transaction.rollback();
    logError(error instanceof Error ? error : new Error(String(error)), {
      file: "payment.ts",
      function: "handleSubscriptionCreated",
      line: 222,
    });
  }
}

const variantIdToKey: Record<string, string> = Object.fromEntries(
  Object.entries(VARIANTS).map(([key, id]) => [id, key]),
);

export async function handleSubscriptionPlanChanged(
  data: any,
  userId: string,
  _variantKey: string,
) {
  const transaction = await sequelize.transaction();

  try {
    const numericVariantId = String(data.attributes?.variant_id ?? "");
    const resolvedVariantKey = variantIdToKey[numericVariantId] || _variantKey;

    const newPlan = await getPlanByVariantKey(resolvedVariantKey);
    if (!newPlan) {
      await transaction.rollback();
      return;
    }

 
    await Subscription.update(
      {
        planId: newPlan.id,
      },
      {
        where: {
          userId,
        },
        transaction,
      },
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
  }
}

export async function handleSubscriptionUpdated(data: any, userId: string) {
  const transaction = await sequelize.transaction();

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
      transaction,
    });

    if (!subscription) {
      await transaction.rollback();
      logInfo("Subscription not found for update — skipping", {
        subscriptionId,
        userId,
      });
      return;
    }

    await subscription.update(
      {
        isActive: status === "active" || status === "on_trial",
        status,
        renewsAt: renewsAt ? new Date(renewsAt) : null,
        endDate: endsAt ? new Date(endsAt) : null,
        cardBrand: cardBrand || undefined,
        cardLastFour: cardLastFour || undefined,
        updatePaymentMethodUrl: updatePaymentMethodUrl || undefined,
      },
      { transaction },
    );

    await transaction.commit();

    logInfo("Subscription updated", { subscriptionId, userId });
  } catch (error) {
    await transaction.rollback();
    logError(error instanceof Error ? error : new Error(String(error)), {
      file: "payment.ts",
      function: "handleSubscriptionUpdated",
      line: 272,
    });
  }
}

export async function handleSubscriptionCancelled(data: any, userId: string) {
  const transaction = await sequelize.transaction();

  try {
    const attributes = data.attributes || {};
    const subscriptionId = data.id;
    const endsAt = attributes.ends_at;
    const cancelledAt = attributes.cancelled_at;
    const cancelReason = attributes.cancellation_reason;

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
      transaction,
    });

    if (subscription) {
      await subscription.update(
        {
          isActive: false,
          endDate: endsAt ? new Date(endsAt) : null,
          cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
          cancelReason: cancelReason || null,
        },
        { transaction },
      );

      const cancelTxnId = `cancel-${subscriptionId}`;
      const existingCancelTxn = await Transaction.findOne({
        where: { providerTransactionId: cancelTxnId },
        transaction,
      });

      if (!existingCancelTxn) {
        await Transaction.create(
          {
            userId,
            subscriptionId: subscription.id,
            provider: "lemon_squeezy",
            providerTransactionId: cancelTxnId,
            providerOrderId: attributes.order_id
              ? String(attributes.order_id)
              : null,
            amount: 0,
            currency: "USD",
            status: "cancelled",
            description: "Subscription cancelled",
          },
          { transaction },
        );
      }

      await transaction.commit();

      logInfo("Subscription cancelled", { subscriptionId, userId });
    } else {
      await transaction.rollback();
      logInfo("Subscription not found for cancellation", {
        subscriptionId,
        userId,
      });
    }
  } catch (error) {
    await transaction.rollback();
    logError(error instanceof Error ? error : new Error(String(error)), {
      file: "payment.ts",
      function: "handleSubscriptionCancelled",
      line: 333,
    });
  }
}

export async function handleSubscriptionExpired(data: any, userId: string) {
  const transaction = await sequelize.transaction();

  try {
    const subscriptionId = data.id;

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
      transaction,
    });

    if (subscription) {
      await subscription.update(
        {
          isActive: false,
        },
        { transaction },
      );

      await transaction.commit();

      logInfo("Subscription expired", { subscriptionId, userId });
    } else {
      await transaction.rollback();
    }
  } catch (error) {
    await transaction.rollback();
    logError(error instanceof Error ? error : new Error(String(error)), {
      file: "payment.ts",
      function: "handleSubscriptionExpired",
      line: 369,
    });
  }
}

export async function handleSubscriptionResumed(data: any, userId: string) {
  const transaction = await sequelize.transaction();

  try {
    const attributes = data.attributes || {};
    const subscriptionId = data.id;
    const renewsAt = attributes.renews_at;

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
      transaction,
    });

    if (subscription) {
      await subscription.update(
        {
          isActive: true,
          renewsAt: renewsAt ? new Date(renewsAt) : null,
          cancelledAt: null,
          cancelReason: null,
        },
        { transaction },
      );

      const resumeTxnId = `resume-${subscriptionId}`;
      const existingResumeTxn = await Transaction.findOne({
        where: { providerTransactionId: resumeTxnId },
        transaction,
      });

      if (!existingResumeTxn) {
        await Transaction.create(
          {
            userId,
            subscriptionId: subscription.id,
            provider: "lemon_squeezy",
            providerTransactionId: resumeTxnId,
            amount: 0,
            currency: "USD",
            status: "paid",
            description: "Subscription resumed",
            paidAt: new Date(),
          },
          { transaction },
        );
      }

      await transaction.commit();

      logInfo("Subscription resumed", { subscriptionId, userId });
    } else {
      await transaction.rollback();
    }
  } catch (error) {
    await transaction.rollback();
    logError(error instanceof Error ? error : new Error(String(error)), {
      file: "payment.ts",
      function: "handleSubscriptionResumed",
      line: 425,
    });
  }
}

export async function handleSubscriptionPaymentSuccess(
  data: any,
  userId: string,
) {
  const transaction = await sequelize.transaction();

  try {
    const attributes = data.attributes || {};
    const subscriptionId = attributes.subscription_id;
    const orderId = attributes.order_id;
    const amount = attributes.total;
    const currency = attributes.currency;

    if (!subscriptionId) {
      await transaction.rollback();
      logInfo("No subscription_id in payment success event", { userId });
      return;
    }

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
      transaction,
    });

    if (subscription) {
      const paymentTxnId = orderId
        ? `payment-${orderId}`
        : `payment-${subscriptionId}`;

      const existingPaymentTxn = await Transaction.findOne({
        where: { providerTransactionId: paymentTxnId },
        transaction,
      });

      if (!existingPaymentTxn) {
        await Transaction.create(
          {
            userId,
            subscriptionId: subscription.id,
            provider: "lemon_squeezy",
            providerTransactionId: paymentTxnId,
            providerOrderId: orderId ? String(orderId) : null,
            amount: amount || 0,
            currency: currency || "USD",
            status: "paid",
            description: "Subscription payment successful",
            paidAt: new Date(),
          },
          { transaction },
        );
      }

      await transaction.commit();

      logInfo("Payment recorded", { subscriptionId, userId, orderId });
    } else {
      await transaction.rollback();
      logInfo("Subscription not found for payment", { subscriptionId, userId });
    }
  } catch (error) {
    await transaction.rollback();
    logError(error instanceof Error ? error : new Error(String(error)), {
      file: "payment.ts",
      function: "handleSubscriptionPaymentSuccess",
      line: 483,
    });
  }
}

export async function handleSubscriptionPaymentFailed(
  data: any,
  userId: string,
) {
  const transaction = await sequelize.transaction();

  try {
    const attributes = data.attributes || {};
    const subscriptionId = attributes.subscription_id || data.id;

    if (!subscriptionId) {
      await transaction.rollback();
      return;
    }

    const subscription = await Subscription.findOne({
      where: { lemonSqueezyId: String(subscriptionId) },
      transaction,
    });

    if (subscription) {
      await subscription.update(
        { isActive: false },
        { transaction },
      );

      const failedTxnId = `failed-${subscriptionId}-${Date.now()}`;
      await Transaction.create(
        {
          userId,
          subscriptionId: subscription.id,
          provider: "lemon_squeezy",
          providerTransactionId: failedTxnId,
          amount: 0,
          currency: "USD",
          status: "failed",
          description: "Subscription payment failed",
        },
        { transaction },
      );

      await transaction.commit();

      logInfo("Subscription payment failed — deactivated", {
        subscriptionId,
        userId,
      });
    } else {
      await transaction.rollback();
    }
  } catch (error) {
    await transaction.rollback();
    logError(error instanceof Error ? error : new Error(String(error)), {
      file: "payment.ts",
      function: "handleSubscriptionPaymentFailed",
      line: 0,
    });
  }
}

export async function assignFreePlan(
  userId: string,
  options?: { transaction?: SequelizeTransaction },
) {
  const freePlan = await Plan.findOne({
    where: { variantId: "free" },
    transaction: options?.transaction,
  });

  if (!freePlan) {
    logError(new Error("Free plan not found in database"), {
      file: "payment.ts",
      function: "assignFreePlan",
      line: 0,
    });
    return;
  }

  const existing = await Subscription.findOne({
    where: { userId, isActive: true },
    transaction: options?.transaction,
  });

  if (existing) {
    return;
  }

  try {
    await Subscription.create(
      {
        userId,
        planId: freePlan.id,
        isActive: true,
        status: "free",
        startDate: new Date(),
      },
      { transaction: options?.transaction },
    );
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return;
    }
    throw err;
  }
}

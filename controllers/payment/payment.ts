import { Request, Response, NextFunction } from "express";
import { VARIANTS } from "../../constants/variants";
import { sendError } from "../../utils/sendError";
import { User } from "../../models/user";
import { lemonSqueezyConfig } from "../../services/payment";
import "dotenv/config";
import { Webhook } from "@lemonsqueezy/lemonsqueezy.js";

const {
  LEMON_SQUEEZY_STORE_ID,
  LEMON_SQUEEZY_CANCEL_URL,
  LEMON_SQUEEZY_REDIRECT_URL,
} = process.env;

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

export function handleOrderCreated(data: Webhook, userId: string) {
  try {
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

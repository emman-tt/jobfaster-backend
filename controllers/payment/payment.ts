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
    const { userEmail } = req.body;
    const decoded = req.user;

    const variantKey = req.body?.variantKey as
      | "monthly_pro"
      | "monthly_premium";

    const variantId = VARIANTS[variantKey];
    if (!variantId) {
      return sendError(res, "INVALID_CREDENTIALS", 404, "failed");
    }

    const user = await User.findByPk(decoded?.sub, {
      include: ["id", "name", "email"],
    });

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: lemonSqueezyConfig.getHeaders(),
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: userEmail,
              custom: {
                user_id: user?.id,
              },
            },
            redirectUrl: LEMON_SQUEEZY_REDIRECT_URL,
            cancel_url: LEMON_SQUEEZY_CANCEL_URL,
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
    const checkoutUrl = data.data.attributes.url;
    console.log(checkoutUrl);
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

import "dotenv/config";

const { PRO_PLAN_ID, PREMIUM_PLAN_ID } = process.env;
interface variants {
  monthly_pro: string;
  monthly_premium: string;
}
export const VARIANTS: variants = {
  monthly_pro: PREMIUM_PLAN_ID,
  monthly_premium: PRO_PLAN_ID,
};

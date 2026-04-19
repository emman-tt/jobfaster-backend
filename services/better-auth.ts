import { betterAuth } from "better-auth";
import { adapter } from "./adapter.js";
import dotenv from "dotenv";
dotenv.config();
const {
  BETTER_AUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL,
  DEVELOPMENT,
} = process.env;
export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  database: adapter(),
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      
    },
  },
  trustedOrigins: [FRONTEND_URL],
  emailAndPassword: {
    enabled: false,
  },

  session: {
    expiresIn: 60 * 15,
    updateAge: 60 * 60,
  },
  cookiePrefix: "jobber",
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: DEVELOPMENT === "production",
    },
  },
});

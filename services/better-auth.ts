import { betterAuth } from "better-auth";
import { adapter } from "./adapter.js";
const {
  BETTER_AUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL,
  DEVELOPMENT,
} = process.env;

const FRONTEND_URLS = ["http://localhost:5173", "http://localhost:5174"];

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  database: adapter(),
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
  },
  trustedOrigins: FRONTEND_URLS,
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

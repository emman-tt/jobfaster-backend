import { betterAuth } from "better-auth";
import { adapter } from "./adapter.js";

export const auth = betterAuth({
  baseURL: "http://localhost:3000",
  database: adapter(),
  emailAndPassword: {
    enabled: false,
  },
  session: {
    expiresIn: 60 * 15,
    updateAge: 60 * 60,
  },
  cookiePrefix: "jobber",
});
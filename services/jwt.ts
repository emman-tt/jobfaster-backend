import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
export async function generateToken(
  email: string,
  role: string,
): Promise<AuthTokens> {
  const accessSecret = process.env.ACCESS_SECRET;
  const refreshSecret = process.env.REFRESH_SECRET;
  const payload = {
    sub: email,
    role: role,
  };

  if (!accessSecret || !refreshSecret) {
    throw new Error("Missing JWT Secrets in environment variables");
  }
  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: "7d",
  });

  return {
    accessToken,
    refreshToken,
  };
}

import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../models/user";
import { Account } from "../../models/better-auth";
import { resend } from "../../services/email";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import { Op } from "sequelize";

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email: email } });
    if (!user) {

      return sendSuccess(res, 200, "success", "EMAIL_SUCCESS");
    }


    const socialAccount = await User.findOne({
      where: { id: user.id, password: "managed-by-better-auth" },
    });
    if (socialAccount) {

      return sendError(res, "SOCIAL_ACCOUNT", 400, "failed");
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({
      resetToken: token,
      resetTokenExpires: expires,
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "<noreply@emmanverse.uk>",
      to: email,
      subject: "Reset your Jobfaster password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #1a1a2e;">Reset your password</h1>
          <p style="font-size: 15px; color: #64748b; margin-bottom: 24px; line-height: 1.5;">
            We received a request to reset the password for your Jobfaster account. 
            Click the button below to set a new one.
          </p>
          <a href="${resetLink}" 
             style="display: inline-block; background: #f17e27; color: white; font-weight: 600; 
                    font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
            This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return sendSuccess(res, 200, "success", "EMAIL_SUCCESS");
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return sendError(res, "TOKEN_INVALID", 401, "failed");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    });

    return sendSuccess(res, 200, "success", "PASSWORD_CHANGED");
  } catch (error) {
    next(error);
  }
}

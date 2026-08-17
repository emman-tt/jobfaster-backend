import { Response, Request, NextFunction } from "express";
import { Settings } from "../../models/settings";
import { User } from "../../models/user";
import { sendSuccess } from "../../utils/sendSuccess";
import { sequelize } from "../../database/pool";
import { Token } from "../../models/token";
import { Account } from "../../models/better-auth";
import { Pointer } from "../../models/pointer";
import { File } from "../../models/file";
import { Folder } from "../../models/folder";
import { Activity } from "../../models/activity";
import { UserJob } from "../../models/user-jobs";
import { Subscription } from "../../models/subscription";
import { Transaction } from "../../models/transaction";

export async function FetchSettingsData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const userSettings = await Settings.findOne({
      where: {
        userId: userId,
      },
      include: [
        {
          model: User,
          attributes: ["name", "email", "emailVerified", "image"],
        },
      ],
    });

    sendSuccess(res, undefined, undefined, "FETCH_SUCCESS", userSettings);
  } catch (error) {
    next(error);
  }
}

export async function UpdateNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const inputBody = req.body;

    const allowedFields = [
      "newJobsAlert",
      "aiTailoringComplete",
      "jobEmailSendAlert",
    ];

    const updates: Record<string, boolean> = {};

    for (const field of allowedFields) {
      if (inputBody[field] !== undefined) {
        updates[field] = inputBody[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await Settings.update(updates, {
      where: {
        userId: userId,
      },
    });

    sendSuccess(res, undefined, undefined, "UPDATE SUCCESS");
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    await Transaction.destroy({ where: { userId }, transaction: t });
    await Subscription.destroy({ where: { userId }, transaction: t });
    await UserJob.destroy({ where: { userId }, transaction: t });
    await Activity.destroy({ where: { userId }, transaction: t });

    const pointers = await Pointer.findAll({ where: { userId }, transaction: t });
    const pointerIds = pointers.map((p) => p.id);

    if (pointerIds.length > 0) {
      await File.destroy({ where: { id: pointerIds }, transaction: t });
      await Folder.destroy({ where: { id: pointerIds }, transaction: t });
      await Pointer.destroy({ where: { userId }, transaction: t });
    }

    await Account.destroy({ where: { userId }, transaction: t });
    await Token.destroy({ where: { userId }, transaction: t });
    await Settings.destroy({ where: { userId }, transaction: t });
    await User.destroy({ where: { id: userId }, transaction: t });

    await t.commit();

    sendSuccess(res, undefined, undefined, "ACCOUNT_DELETED");
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

import { Request, Response, NextFunction } from "express";
import { generatePDFFromHTML } from "../../services/pdf-generator";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import { Pointer } from "../../models/pointer";
import { Subscription } from "../../models/subscription";
import { Plan } from "../../models/plans";
import { File } from "../../models/file";
import { Activity } from "../../models/activity";
import { sequelize } from "../../database/pool";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  PlanLimitError,
  checkResumeUploadLimit,
  checkStorageLimit,
  getSubscriptionWithPlan,
  getPlan,
} from "../../services/planEnforcer";

export async function saveResumePDF(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();

  try {
    const { html, name } = req.body;
    const decoded = req?.user;
    const userId = decoded?.sub as string;

    if (!html || !name) {
      return sendError(res, "NO_FILE", 400, "failed");
    }

    const subscription = await getSubscriptionWithPlan(userId);

    if (subscription) {
      const plan = getPlan(subscription);
      checkResumeUploadLimit(subscription, plan);
    }

    const result = await generatePDFFromHTML(html, name);

    if (subscription) {
      const plan = getPlan(subscription);
      checkStorageLimit(subscription, plan, result.size);
    }

    const id = uuidv4();

    await Pointer.create(
      {
        id,
        userId,
        type: "FILE",
      },
      { transaction: t },
    );

    await Activity.create(
      {
        message: `Created a new resume - ${name}`,
        userId,
        type: "FILE",
      },
      { transaction: t },
    );

    await File.create(
      {
        id,
        source: "upload",
        metaData: {
          name,
          layoutId: null,
          extension: "pdf",
          size: result.size,
          content: result.url,
          downloadUrl: result.downloadUrl,
        },
      },
      { transaction: t },
    );

    if (subscription) {
      await subscription.increment(
        {
          resumeUploadsThisMonth: 1,
          currentStorageBytes: result.size,
        },
        { transaction: t },
      );
    }

    await t.commit();

    return sendSuccess(res, 200, undefined, "RESUME_CREATED", {
      id,
      url: result.url,
      downloadUrl: result.downloadUrl,
      name,
    });
  } catch (error) {
    await t.rollback();
    if (error instanceof PlanLimitError) {
      return sendError(res, error.code as any, 403);
    }
    next(error);
  }
}

export async function updateResumePDF(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { html, name } = req.body;
    const fileId = req.params.id as string;
    const decoded = req?.user;
    const userId = decoded?.sub as string;

    if (!html || !name) {
      return sendError(res, "NO_FILE", 400, "failed");
    }

    const pointer = await Pointer.findOne({
      where: { id: fileId, userId, type: "FILE" },
      include: [{ model: File, as: "file" }],
    });

    if (!pointer || !pointer.file) {
      return sendError(res, "NOT_FOUND", 404, "failed");
    }

    const result = await generatePDFFromHTML(html, name);

    await pointer.file.update({
      metaData: {
        ...pointer.file.metaData,
        name,
        size: result.size,
        content: result.url,
        downloadUrl: result.downloadUrl,
      },
    });

    await Activity.create({
      userId,
      type: "FILE",
      message: `Updated resume - ${name}`,
    });

    return sendSuccess(res, 200, undefined, "RESUME_UPDATED", {
      id: fileId,
      url: result.url,
      downloadUrl: result.downloadUrl,
      name,
    });
  } catch (error) {
    next(error);
  }
}

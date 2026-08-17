import { v2 as cloudinary } from "cloudinary";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import { Pointer } from "../../models/pointer";
import { Subscription } from "../../models/subscription";
import { Plan } from "../../models/plans";
import { sequelize } from "../../database/pool";
import { File } from "../../models/file";
import { Activity } from "../../models/activity";
import {
  PlanLimitError,
  checkResumeUploadLimit,
  checkStorageLimit,
  getPlan,
} from "../../services/planEnforcer";

interface UploadResult {
  id: string;
  type: "file";
  source: "upload";
  extension: "docx" | "pdf";
  name: string;
  size: number;
  content: string;
  layoutId: null;
  createdAt: string;
  download: string;
}

export async function uploadResume(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();
  try {
    const decoded = req?.user;
    const userId = decoded?.sub as string;
    const file = req.file as any;

    const subscription = await Subscription.findOne({
      where: { userId, isActive: true },
      include: [{ model: Plan }],
    });

    if (subscription) {
      const plan = getPlan(subscription);
      checkResumeUploadLimit(subscription, plan);
      checkStorageLimit(subscription, plan, file.size);
    }

    const buffer = file.buffer;

    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "Jobfaster",
          resource_type: "auto",
          public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(buffer);
    });

    const downloadUrl = uploadResult.secure_url.replace(
      "/upload/",
      "/upload/fl_attachment/",
    );

    const randomId = uuidv4().split("-")[0];
    const data: UploadResult = {
      id: randomId,
      type: "file",
      layoutId: null,
      source: "upload",
      extension: file.mimetype === "application/pdf" ? "pdf" : "docx",
      name: file.originalname,
      download: downloadUrl,
      size: file.size,
      content: uploadResult.secure_url,
      createdAt: new Date().toISOString(),
    };

    const id = uuidv4();

    await Pointer.create(
      {
        id: id,
        userId: userId,
        type: "FILE",
      },
      {
        transaction: t,
      },
    );

    await Activity.create(
      {
        message: `Uploaded a new file - ${data.name}.${data.extension}`,
        userId: userId,
        type: "FILE",
      },
      {
        transaction: t,
      },
    );

    await File.create(
      {
        id: id,
        source: "upload",
        metaData: {
          name: data.name,
          extension: data.extension,
          layoutId: null,
          size: data.size,
          content: data.content,
          downloadUrl: data.download,
        },
      },
      {
        transaction: t,
      },
    );

    if (subscription) {
      await subscription.increment(
        {
          resumeUploadsThisMonth: 1,
          currentStorageBytes: file.size,
        },
        { transaction: t },
      );
    }

    await t.commit();

    return sendSuccess(res, 200, undefined, "UPLOAD_SUCCESS", data);
  } catch (error) {
    await t.rollback();
    if (error instanceof PlanLimitError) {
      return sendError(res, error.code as any, 403);
    }
    next(error);
  }
}

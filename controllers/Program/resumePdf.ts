import { Request, Response, NextFunction } from "express";
import { generatePDFFromHTML } from "../../services/pdf-generator";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import { Pointer } from "../../models/pointer";
import { File } from "../../models/file";
import { Activity } from "../../models/activity";
import { sequelize } from "../../database/pool";
import { v4 as uuidv4 } from "uuid";
export async function saveResumePDF(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();

  try {
    const { html, name } = req.body;
    const decoded = req?.user;

    if (!html || !name) {
      return sendError(res, "NO_FILE", 400, "failed");
    }

    const result = await generatePDFFromHTML(html, name);

    const userId = decoded?.sub as string;
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

    await t.commit();

    return sendSuccess(res, 200, undefined, "RESUME_CREATED", {
      url: result.url,
      downloadUrl: result.downloadUrl,
      name,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

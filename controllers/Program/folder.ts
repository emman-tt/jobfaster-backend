import { Request, Response, NextFunction } from "express";
import { Pointer } from "../../models/pointer";
import { sequelize } from "../../database/pool";
import { Folder } from "../../models/folder";
import { sendSuccess } from "../../utils/sendSuccess";
import { v4 as uuidv4 } from "uuid";
import { Activity } from "../../models/activity";
export async function UploadFolder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();
  try {
    const decoded = req.user;
    const userId = decoded?.sub as string;
    const folderName = req.params.folderName as string;

    const id = uuidv4();
    await Pointer.create(
      {
        id: id,
        userId,
        type: "FOLDER",
      },
      {
        transaction: t,
      },
    );

    await Activity.create(
      {
        userId: userId,
        type: "FOLDER",
        message: `Created a new folder - ${folderName}`,
      },
      {
        transaction: t,
      },
    );

    await Folder.create(
      {
        id: id,
        metaData: {
          size: 4096,
          name: folderName,
        },
      },
      {
        transaction: t,
      },
    );

    sendSuccess(res, 200, undefined, "UPLOAD_SUCCESS");

    await t.commit();
  } catch (error) {
    console.log(error);
    await t.rollback();
    next(error);
  }
}

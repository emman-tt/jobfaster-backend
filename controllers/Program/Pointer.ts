import { Request, Response, NextFunction } from "express";
import { Pointer } from "../../models/pointer";
import { sendSuccess } from "../../utils/sendSuccess";
import { File } from "../../models/file";
import { Folder } from "../../models/folder";

export async function getPrograms(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const programs = await Pointer.findAll({
      where: {
        userId: userId,
      },
      attributes: ["type"],
      include: [
        { model: File, as: "files" },
        { model: Folder, as: "folders" },
      ],
    });


    sendSuccess(res, 200, "success", "FETCH_SUCCESS", programs || []);
  } catch (error) {
    next(error);
  }
}

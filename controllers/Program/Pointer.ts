import { Request, Response, NextFunction } from "express";
import { Pointer } from "../../models/pointer";
import { sendSuccess } from "../../utils/sendSuccess";
import { File } from "../../models/file";
import { Folder } from "../../models/folder";
import { it } from "node:test";

export async function getPrograms(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const files = await Pointer.findAll({
      where: {
        userId: userId,
        type: "FILE",
      },
      attributes: ["type"],
      include: [{ model: File, as: "file", required: true }],
    });
    const folders = await Pointer.findAll({
      where: {
        userId: userId,
        type: "FOLDER",
      },
      attributes: ["type"],

      include: [
        {
          model: Folder,
          as: "folder",
          required: true,
        },
      ],
    });
    const allPrograms = [...files, ...folders];
  
    sendSuccess(res, 200, "success", "FETCH_SUCCESS", allPrograms || []);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

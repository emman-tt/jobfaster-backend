import { Request, Response, NextFunction } from "express";
import { Pointer } from "../../models/pointer";
import { sendSuccess } from "../../utils/sendSuccess";
import { File } from "../../models/file";
import { Folder } from "../../models/folder";
import { it } from "node:test";
import { sendError } from "../../utils/sendError";

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

    const formatedFolders = folders.map((folderPointer) => {
      const folder = folderPointer?.folder;

      const folderFiles = files
        .filter((filePointer) => filePointer?.file?.folderId === folder.id)
        .map((filePointer) => filePointer?.file);

      return {
        type: "FOLDER",
        folder: {
          ...folder.toJSON(),
          files: folderFiles,
        },
      };
    });

    const allPrograms = [...files, ...formatedFolders];

    sendSuccess(res, 200, "success", "FETCH_SUCCESS", allPrograms || []);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

export async function MoveFile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fileId, folderId } = req.body;

    const decoded = req.user;
    const userId = decoded?.sub;

    const fileExist = await File.findOne({
      where: {
        id: fileId,
      },
    });

    if (!fileExist) {
      return sendError(res, "NO_FILE", 404, "failed");
    }
    const folderExist = await Folder.findByPk(folderId);

    if (!folderExist) {
      return sendError(res, "NO_FOLDER", 404, "failed");
    }

    await fileExist.update({
      folderId: folderExist.dataValues.id,
    });

    sendSuccess(res, undefined, "success", "UPDATE SUCCESS");
  } catch (error) {
    console.log(error);
    next(error);
  }
}

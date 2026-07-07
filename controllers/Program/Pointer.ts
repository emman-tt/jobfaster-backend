import { Request, Response, NextFunction } from "express";
import { Pointer } from "../../models/pointer";
import { sendSuccess } from "../../utils/sendSuccess";
import { File } from "../../models/file";
import { Folder } from "../../models/folder";

import { sendError } from "../../utils/sendError";
import { sequelize } from "../../database/pool";
import { Activity } from "../../models/activity";
import { Subscription } from "../../models/subscription";

export async function deleteProgram(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const t = await sequelize.transaction();
  try {
    const decoded = req.user;
    const userId = decoded?.sub as string;
    const programId = req.params.id as string;

    const progarm = await Pointer.findByPk(programId, {
      include: [
        { model: File, as: "file" },
        { model: Folder, as: "folder" },
      ],
    });

    if (progarm) {
      await progarm.destroy({ transaction: t });

      if (progarm.type == "FILE") {
        await Activity.create(
          {
            userId,
            message: `Deleted ${progarm?.type.toLowerCase()}`,
            type: "FILE",
          },
          { transaction: t },
        );

        await Subscription.decrement(
          { currentStorageBytes: progarm.file.metaData.size },
          { where: { userId }, transaction: t },
        );
      } else {
        const folderHasFiles = await File.count({
          where: {
            folderId: progarm.id,
          },
        });

        if (folderHasFiles) {
          await File.destroy({
            where: {
              folderId: progarm.id,
            },
            transaction: t,
          });
        }

        await Activity.create(
          {
            userId,
            message: `Deleted ${progarm?.type.toLowerCase()}`,
            type: "FOLDER",
          },
          { transaction: t },
        );

        await Subscription.decrement(
          { currentStorageBytes: progarm.folder.metaData.size },
          { where: { userId }, transaction: t },
        );
      }
    }

    await t.commit();

    sendSuccess(res, 200, "success", "DELETE_SUCCESS");
  } catch (error) {
    console.log(error);
    await t.rollback();
    next(error);
  }
}

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
      attributes: ["type", "updatedAt"],
      include: [{ model: File, as: "file", required: true }],
    });
    const folders = await Pointer.findAll({
      where: {
        userId: userId,
        type: "FOLDER",
      },
      attributes: ["type", "updatedAt"],
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
        updatedAt: folderPointer.updatedAt,
        folder: {
          ...folder.toJSON(),
          files: folderFiles,
        },
      };
    });

    const allPrograms = [...files, ...formatedFolders];

    sendSuccess(res, 200, "success", "FETCH_SUCCESS", allPrograms || []);
  } catch (error) {
    next(error);
  }
}

export async function renameProgram(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const programId = req.params.id as string;
    const newName = req.body.name as string;
    const program = await Pointer.findByPk(programId, {
      include: [
        { model: File, as: "file" },
        { model: Folder, as: "folder" },
      ],
    });

    if (!program) {
      return sendError(res, "NOT_FOUND", 404, "failed");
    }

    if (program.type == "FILE") {
      await File.update(
        {
          metaData: {
            ...program.file!.metaData,
            name: newName,
          },
        },
        { where: { id: program.id } },
      );
    } else {
      await Folder.update(
        {
          metaData: {
            ...program.folder!.metaData,
            name: newName,
          },
        },
        { where: { id: program.id } },
      );
    }

    sendSuccess(res, 200, "success", "UPDATE SUCCESS");
  } catch (error) {
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
    next(error);
  }
}

import * as PdfParse from "pdf-parse-new";
import { v2 as cloudinary } from "cloudinary";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { sendSuccess } from "../../utils/sendSuccess";
import dotenv from "dotenv";
import { User } from "../../models/user";
import { Pointer } from "../../models/pointer";
import { UUIDV4 } from "sequelize";
import { sequelize } from "../../database/pool";
import { File } from "../../models/file";
import { t } from "@upstash/redis/error-8y4qG0W2";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const file = req.file as any;
    const buffer = file.buffer;
    const decoded = req?.user;

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

    const randomId = crypto.randomUUID().split("-")[0];
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
    console.log(data);
    const userId = decoded?.sub as string;

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

    await t.commit();

    return sendSuccess(res, 200, undefined, "UPLOAD_SUCCESS", data);
  } catch (error) {
    t.rollback();
    next(error);
  }
}

async function Parse(file: Buffer) {
  try {
    const buffer = Buffer.from(file);
    const parser = new PdfParse.SmartPDFParser();
    const result = await parser.parse(buffer);
    return result;
  } catch (error) {
    console.log(error);
  }
}

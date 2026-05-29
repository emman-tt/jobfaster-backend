import { Request, Response, NextFunction } from "express";
import { User } from "../../models/user";
import { sendSuccess } from "../../utils/sendSuccess";
import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export async function getUserData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const user = await User.findByPk(userId, {
      attributes: ["name", "email", "emailVerified", "image"],
    });

    sendSuccess(res, undefined, undefined, "FETCH_SUCCESS", user);
  } catch (error) {
    next(error);
  }
}
export async function updateUserData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;
    const inputBody = req.body;
    const allowedFields = ["name", "email", "image"];
    const updates: Record<string, string> = {};
    const file = req.file || null;
    for (const field of allowedFields) {
      if (inputBody[field] !== undefined) {
        updates[field] = inputBody[field];
      }
    }
    if (file) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "jobfaster-images",
            resource_type: "auto",
            public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(file.buffer);
      });

      updates.image = uploadResult?.url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await User.update(updates, {
      where: {
        id: userId,
      },
    });

    sendSuccess(res, undefined, undefined, "PROFILE_UPDATED");
  } catch (error) {
    next(error);
  }
}

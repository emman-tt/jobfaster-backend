import { NextFunction, Request, Response } from "express";
import { getAiQueue } from "../../services/worker";
import { sendSuccess } from "../../utils/sendSuccess";

export async function tailorResume(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const aiQueue = getAiQueue();
    if (!aiQueue) {
      return res.status(503).json({
        success: false,
        message: "Redis service is unavailable, please try again later",
      });
    }

    const { resumeData } = req.body;
    const idempoKey = crypto.randomUUID().split("-")[0];

    const response = await aiQueue.add("ai", {
      data: resumeData,
      jobId: idempoKey,
    });

    console.log(response);

    sendSuccess(res, undefined, undefined, "RESUME_OPTIMIZED", {
      ...response,
    });
  } catch (error) {
    next(error);
  }
}

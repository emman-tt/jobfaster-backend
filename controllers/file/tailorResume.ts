import { NextFunction, Request, Response } from "express";
import { aiQueue } from "../../services/worker";
import { sendSuccess } from "../../utils/sendSuccess";

export async function tailorResume(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { resumeData } = req.body;
    const idempoKey = crypto.randomUUID().split("-")[0];

    const response = await aiQueue.add("ai", {
      data: resumeData,
      jobId: idempoKey,
    });

    console.log(response);

    sendSuccess(
      res,
      undefined,
      undefined,
      "Resume tailored succesfully for the job",
      {
        ...response,
      },
    );
  } catch (error) {
    next(error);
  }
}

import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import * as PdfParse from "pdf-parse-new";

import axios from "axios";
import { talktoAi } from "../ai/ai";

export async function uploadResume(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const resume = req.file as any;
    if (!resume) {
      return sendError(res, "No file provided", 404, "error");
    }
    const cloudinaryUrl = resume.path;
    const response = await axios.get(cloudinaryUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data);
    const parser = new PdfParse.SmartPDFParser();
    const result = await parser.parse(buffer);

    const aiResponse = await talktoAi(result.text);

    return sendSuccess(
      res,
      undefined,
      undefined,
      "PDF uploaded and ai response generated",
      { aiResponse: aiResponse },
    );
  } catch (error) {
    next(error);
  }
}

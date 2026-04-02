import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import * as PdfParse from "pdf-parse-new";

export async function uploadResume(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const resume = req.file as any;
    if (!resume) {
      return sendError(res, "No file provided", 422, "failed");
    }

    // const cloudinaryUrl = resume.path;
    // const response = await axios.get(cloudinaryUrl, {
    //   responseType: "arraybuffer",
    // });

    const result = await Parse(resume.buffer);
    console.log("pages", result?.numpages);
    console.log(result?.text);
    return sendSuccess(
      res,
      undefined,
      undefined,
      "PDF uploaded and ai response generated",
      { aiResponse: result?.text },
    );
  } catch (error) {
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

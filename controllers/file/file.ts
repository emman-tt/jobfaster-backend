import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/sendSuccess";
import { sendError } from "../../utils/sendError";
import * as PdfParse from "pdf-parse-new";


export async function uploadResume(resume: any) {
  try {
    const result = await Parse(resume.buffer);
    console.log(result?.text);
    return result?.text;
  } catch (error) {
    console.log(error);
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

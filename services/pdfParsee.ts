import * as PdfParse from "pdf-parse-new";

export async function Parse(file: any) {
  try {
    const buffer = Buffer.from(file);
    const parser = new PdfParse.SmartPDFParser();
    const result = await parser.parse(buffer);
    return result;
  } catch (error) {
    console.log(error);
  }
}

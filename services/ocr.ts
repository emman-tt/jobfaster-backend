import { createWorker } from "tesseract.js";

export async function OcrExtract(buffer: Buffer) {
  const worker = await createWorker("eng");

  // 2. Recognize text from an image (can be a path, URL, or buffer)
  const result = await worker.recognize(buffer);


  // 4. Terminate the worker to free up resources
  await worker.terminate();
  return result
}

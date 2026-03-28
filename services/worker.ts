import { Redis } from "ioredis";
import dotenv from "dotenv";
import { Queue, Worker } from "bullmq";
import { talktoAi } from "../controllers/ai/ai";

dotenv.config();

const { REDIS_URL } = process.env;

if (!REDIS_URL) {
  throw new Error("Redis url env wasn't injected");
}

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
  connectTimeout: 10000,
});

interface ProcessorResponse {
  status: boolean;
  response: string;
  timestamp: string;
  jobId: string;
  fileId: string;
  rawData?: any;
}

interface inputObject {
  data: any;
  jobId: string;
}
async function delay(seconds: number) {
  await new Promise((resolve) => setTimeout(resolve, seconds));
}

export async function Processor(job: any): Promise<ProcessorResponse> {
  const { data, fileId } = job;

  try {
    const response = await talktoAi(data.data);

    const use = parseResponse(response);
    return {
      status: true,
      jobId: job.token || 0,
      response: use.data,
      fileId: data.data.fileId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      fileId: fileId,
      response: "Failed to process the cv",
      timestamp: new Date().toISOString(),
      jobId: job.token || 0,
    };
  }
}

export const aiQueue = new Queue("ai", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

export const aiWorker = new Worker("ai", Processor, { connection });

interface ParsedData {
  success: boolean;
  data: any;
  raw: string;
}

const parseResponse = (rawResponse: any): ParsedData => {
  try {
    const cleaned = rawResponse
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.resume || !parsed.email) {
      return {
        success: false,
        data: "invalid response generated",
        raw: rawResponse,
      };
    }

    return { success: true, data: parsed, raw: rawResponse };
  } catch (err) {
    console.log(err);
    return { success: false, data: "parsing error occured", raw: rawResponse };
  }
};

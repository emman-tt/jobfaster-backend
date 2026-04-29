import { Redis } from "ioredis";
import { config } from "dotenv";
import { Queue, Worker } from "bullmq";
import { jobApply } from "../controllers/ai/ai";

config();

const { REDIS_URL } = process.env;

console.log("REDIS_URL:", REDIS_URL ? "set" : "NOT SET");

if (!REDIS_URL) {
  throw new Error("Redis url env wasn't injected");
}

let aiQueue: Queue | null = null;
let aiWorker: Worker | null = null;
let redisReady = false;

export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 15000,
  enableOfflineQueue: true,
  lazyConnect: false,
  tls: {
    checkServerIdentity: () => undefined,
  },
  retryStrategy: (times) => {
    if (times > 30) {
      console.log("Max Redis retries reached");
      return null;
    }
    console.log(`Redis retry attempt ${times}`);
    return Math.min(times * 500, 10000);
  },
});

connection.on("connecting", () => console.log("Redis connecting..."));
connection.on("connect", () => console.log("Redis connected"));
connection.on("ready", () => console.log("Redis ready"));
connection.on("error", (err) => console.error("Redis error:", err.message));
connection.on("close", () => {
  console.log("Redis closed");
  redisReady = false;
});

connection.on("ready", async () => {
  if (redisReady && aiWorker && aiQueue) {
    console.log("Already initialized");
    return;
  }

  console.log("Redis ready, initializing queue and worker");

  if (!aiQueue) {
    aiQueue = new Queue("ai", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
      },
    });
  }

  if (!aiWorker) {
    aiWorker = new Worker("ai", Processor, {
      connection,
      removeOnFail: { count: 100 },
      removeOnComplete: { count: 100 },
    });

    aiWorker.on("error", (err) => {
      console.error("Worker error:", err.message);
    });

    aiWorker.on("failed", (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });
  }

  redisReady = true;
  console.log("Queue and worker initialized");
});

interface ProcessorResponse {
  status: "success" | "failed";
  response: string;
  timestamp: string;
  jobId: string;
  fileId: string;
  rawData?: any;
  type: "JOB_APPLY" | string;
  message: string;
}

export async function Processor(job: any): Promise<ProcessorResponse> {
  const { data } = job;
  const type = job.name as string;

  try {
    console.log("Processing job:", type);
    const response = await jobApply(data.updatedData);

    if (response.statusCode === 200 && type === "JOB_APPLY") {
      return handleJobApply(
        undefined,
        response.response,
        "JOB_APPLY",
        job,
        data,
      );
    }
    return handleError("failed", "JOB_APPLY", job, response, data);
  } catch (error: any) {
    console.error("Job processing error:", error.message);
    return handleError(
      "failed",
      "JOB_APPLY",
      job,
      { message: error.message },
      data,
    );
  }
}

function handleJobApply(
  status: "success" = "success",
  response: any,
  type: "JOB_APPLY",
  job: any,
  data: any,
) {
  const parsed = parseResponse(response);
  return {
    status,
    type,
    jobId: job.token || 0,
    response: parsed.data,
    fileId: data.fileId,
    timestamp: new Date().toISOString(),
    message: response.message || "done",
  };
}

function handleError(
  status: "failed" = "failed",
  type: "JOB_APPLY" | string,
  job: any,
  response: any,
  data: any,
) {
  return {
    status,
    type,
    jobId: job.token || 0,
    response: response?.data || null,
    fileId: data?.fileId,
    timestamp: new Date().toISOString(),
    message: response?.message || "error",
  };
}

export const getAiQueue = () => aiQueue;
export const getAiWorker = () => aiWorker;

export const onWorkerReady = (
  callback: (queue: Queue, worker: Worker) => void,
): (() => void) => {
  if (aiQueue && aiWorker) {
    callback(aiQueue, aiWorker);
  }

  const checkInterval = setInterval(() => {
    if (aiQueue && aiWorker) {
      clearInterval(checkInterval);
      callback(aiQueue, aiWorker);
    }
  }, 100);

  return () => clearInterval(checkInterval);
};

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
      return { success: false, data: "invalid response", raw: rawResponse };
    }

    return { success: true, data: parsed, raw: rawResponse };
  } catch (err) {
    console.error("Parse error:", err);
    return { success: false, data: "parsing failed", raw: rawResponse };
  }
};

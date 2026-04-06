import { Redis } from "ioredis";
import dotenv from "dotenv";
import { Queue, Worker } from "bullmq";
import { talktoAi } from "../controllers/ai/ai";

dotenv.config();

const { REDIS_URL } = process.env;

if (!REDIS_URL) {
  throw new Error("Redis url env wasn't injected");
}

let errorCount = 0;
let redisConnected = false;
let aiQueue: Queue | null = null;
let aiWorker: Worker | null = null;

export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 300000,
  tls: {},
  connectTimeout: 10000,
  enableOfflineQueue: false,
  lazyConnect: true,
  maxReconnectSteps: 2,
  retryStrategy: (times) => {
    if (redisConnected === false && times > 3) {
      console.log("Max retries reached, stopping reconnection attempts");
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  reconnectOnError: (err: any) => {
    if (err.code === "ENOTFOUND") {
      console.log("DNS error detected, skip reconnection");
      return false;
    }
    return Number(err.message.split(" ")[0]) !== 1;
  },
});

connection.on("error", (err) => {
  errorCount++;
  console.error("Redis connection error:", err);
  if (errorCount > 5 && redisConnected) {
    console.log("Disconnecting Redis due to too many errors");
    connection.disconnect();
    redisConnected = false;
    if (aiWorker) {
      aiWorker.close().catch(console.error);
      aiWorker = null;
    }
    if (aiQueue) {
      aiQueue.close().catch(console.error);
      aiQueue = null;
    }
  }
});

connection.on("connect", async () => {
  errorCount = 0; // Reset on successful connect
  redisConnected = true;
  console.log("Connected to Redis, initializing worker and queue");

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
      removeOnFail: undefined,
    });
  }
});

interface ProcessorResponse {
  status: boolean;
  response: string;
  timestamp: string;
  jobId: string;
  fileId: string;
  rawData?: any;
  type: "JOB_APPLY" | "RESUME_UPLOAD";
  message: string;
}

export async function Processor(job: any): Promise<ProcessorResponse> {
  const { data, type } = job;
  const { fileId } = data;

  if (connection.status !== "ready") {
    return {
      status: false,
      type: type,
      response: "Redis not connected",
      timestamp: new Date().toISOString(),
      jobId: job.token || 0,
      fileId: fileId,
      message: "Connection error",
    };
  }

  try {
    const response = await talktoAi(data.data, type);

    if (response.statusCode !== 200) {
      return {
        status: false,
        type: type,
        jobId: job.token || 0,
        response: response.response || "",
        fileId: data.data.fileId || 0,
        timestamp: new Date().toISOString(),
        message: response.message,
      };
    }

    if (type === "JOB_APPLY") {
      return handleJobApply(response.response, "JOB_APPLY", job, data);
    }

    if (type === "RESUME_UPLOAD") {
      return handleResumeUpload(response.response, "RESUME_UPLOAD", job, data);
    }

    return {
      status: false,
      type: type,
      jobId: job.token || 0,
      response: response.response || "",
      fileId: data.data.fileId || 0,
      timestamp: new Date().toISOString(),
      message: response.message,
    };
  } catch (error) {
    console.log("error", error);
    return {
      status: false,
      fileId: fileId,
      type: type,
      response: "Failed to process the cv",
      timestamp: new Date().toISOString(),
      jobId: job.token || 0,
      message: " Message queuing  error",
    };
  }
}

function handleJobApply(response: any, type: "JOB_APPLY", job: any, data: any) {
  const use = parseResponse(response);
  return {
    status: true,
    type: type,
    jobId: job.token || 0,
    response: use.data,
    fileId: data.data.fileId,
    timestamp: new Date().toISOString(),
    message: response.message,
  };
}
function handleResumeUpload(
  response: any,
  type: "RESUME_UPLOAD",
  job: any,
  data: any,
) {
  // const use = parseResponse(response);
  return {
    status: true,
    type: type,
    jobId: job.token || 0,
    response: response.data,
    fileId: data.data.fileId,
    timestamp: new Date().toISOString(),
    message: response.message,
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

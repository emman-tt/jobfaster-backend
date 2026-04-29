import { Redis } from "ioredis";
import { config } from "dotenv";
import { Queue, Worker } from "bullmq";
import { jobApply } from "../controllers/ai/ai";
import { sendJobMail } from "../controllers/Mails/jobMail";

config();

const { REDIS_URL } = process.env;

console.log("REDIS_URL:", REDIS_URL ? "set" : "NOT SET");

if (!REDIS_URL) {
  throw new Error("Redis url env wasn't injected");
}

let aiQueue: Queue | null = null;
let aiWorker: Worker | null = null;
let mailQueue: Queue | null = null;
let mailWorker: Worker | null = null;
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

interface ProcessorResponse {
  status: "success" | "failed";
  response: string;
  timestamp: string;
  jobId: string;
  fileId?: string;
  rawData?: any;
  type: "JOB_APPLY" | "JOB_MAIL" | string;
  message: string;
}

interface EmailInput {
  to: string;
  userName: string;
  userEmail: string;
  subject: string;
  greeting: string;
  body: string;
  callToAction: string;
  attachmentNote: string;
  signOff: string;
  pdfUrl: string;
}

export async function EmailProcessor(job: any): Promise<ProcessorResponse> {
  const data = job.data as EmailInput;
  const type = job.name as string;

  try {
    console.log("Processing email job:", type);
    const result = await sendJobMail({
      ...data,
    });

    if (result.status == "failed") {
      return handleError("failed", "JOB_APPLY", job, result.message, data);
    }

    return {
      status: "success",
      type: "JOB_MAIL",
      jobId: job.token || 0,
      response: result.data,
      timestamp: new Date().toISOString(),
      message: "Email sent successfully",
    };
  } catch (error: any) {
    console.error("Email job processing error:", error);
    return handleError("failed", "JOB_APPLY", job, error.message, data);
  }
}

export async function AiProcessor(job: any): Promise<ProcessorResponse> {
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
    console.error("Job processing error:", error);
    return handleError("failed", "JOB_APPLY", job, error.message, data);
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
export const getMailQueue = () => mailQueue;
export const getMailWorker = () => mailWorker;

connection.on("ready", async () => {
  if (redisReady && aiWorker && aiQueue && mailWorker && mailQueue) {
    console.log("Already initialized");
    return;
  }

  console.log("Redis ready, initializing queues and workers");

  // AI queue
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

  // Email queue
  if (!mailQueue) {
    mailQueue = new Queue("email", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    });
  }

  // AI worker
  if (!aiWorker) {
    aiWorker = new Worker("ai", AiProcessor, {
      connection,
      removeOnFail: { count: 100 },
      removeOnComplete: { count: 100 },
    });

    aiWorker.on("error", (err) => {
      console.error("AI Worker error:", err.message);
    });

    aiWorker.on("failed", (job, err) => {
      console.error(`AI Job ${job?.id} failed:`, err.message);
    });
  }

  // Email worker
  if (!mailWorker) {
    mailWorker = new Worker("email", EmailProcessor, {
      connection,
      removeOnFail: { count: 100 },
      removeOnComplete: { count: 100 },
    });

    mailWorker.on("error", (err) => {
      console.error("Email Worker error:", err.message);
    });

    mailWorker.on("failed", (job, err) => {
      console.error(`Email Job ${job?.id} failed:`, err.message);
    });
  }

  redisReady = true;
  console.log("Queues and workers initialized");
});

export const onMailWorkerReady = (
  callback: (queue: Queue, worker: Worker) => void,
): (() => void) => {
  if (mailQueue && mailWorker) {
    callback(mailQueue, mailWorker);
  }

  const checkInterval = setInterval(() => {
    if (mailQueue && mailWorker) {
      clearInterval(checkInterval);
      callback(mailQueue, mailWorker);
    }
  }, 100);

  return () => clearInterval(checkInterval);
};
export const onAiWorkerReady = (
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

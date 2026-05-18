import { Redis } from "ioredis";
import { Queue, Worker } from "bullmq";
import { jobApply } from "../controllers/ai/ai";
import { sendJobMail } from "../controllers/Mails/jobMail";
import { logError } from "../utils/logger.js";
import { File } from "../models/file";
import { sequelize } from "../database/pool";
import { Activity } from "../models/activity";
import { UserJob } from "../models/user-jobs";
import { v4 as uuidv4 } from "uuid";

const { REDIS_URL } = process.env;

console.log("REDIS_URL:", REDIS_URL ? "set" : "NOT SET");

if (!REDIS_URL) {
  throw new Error("Redis url env wasn't injected");
}

let aiQueue: Queue | null = null;
let aiWorker: Worker | null = null;
let mailQueue: Queue | null = null;
let mailWorker: Worker | null = null;

export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 15000,
  enableOfflineQueue: true,
  tls: {
    checkServerIdentity: () => undefined,
  },
  retryStrategy: (times) => {
    if (times > 4) {
      console.log(`Redis unreachable after ${times} attempts, retrying every 30s`);
      return 30000;
    }
    console.log(`Redis retry attempt ${times}`);
    return Math.min(times * 1000, 5000);
  },
});

// Connection event listeners (just for logging)
connection.on("connecting", () => console.log("Redis connecting..."));
connection.on("connect", () => console.log("Redis connected"));
connection.on("ready", () => console.log("Redis ready"));
connection.on("error", (err) =>
  logError(err, { file: "worker.ts", function: "connection", line: 44 }),
);
connection.on("close", () => console.log("Redis closed"));

console.log("Initializing queues and workers...");

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
    drainDelay: 30,
    removeOnFail: { count: 100 },
    removeOnComplete: { count: 100 },
  });

  aiWorker.on("error", (err) => {
    logError(err, {
      file: "worker.ts",
      function: "aiWorker",
      line: 213,
    });
  });

  aiWorker.on("failed", (job, err) => {
    logError(err, {
      file: "worker.ts",
      function: "aiWorker",
      line: 217,
    });
  });
}

// Email worker
if (!mailWorker) {
  mailWorker = new Worker("email", EmailProcessor, {
    connection,
    drainDelay: 30,
    removeOnFail: { count: 100 },
    removeOnComplete: { count: 100 },
  });

  mailWorker.on("error", (err) => {
    logError(err, {
      file: "worker.ts",
      function: "mailWorker",
      line: 230,
    });
  });

  mailWorker.on("failed", (job, err) => {
    logError(err, {
      file: "worker.ts",
      function: "mailWorker",
      line: 234,
    });
  });
}



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
  jobTitle: string;
  company: string;
  jobDescription: string;
}

export async function EmailProcessor(job: any): Promise<ProcessorResponse> {
  const { data } = job;
  const type = job.name as string;
  const userId = data.userId;
  const validatedData = data.validatedData as EmailInput;
  const t = await sequelize.transaction();
  try {
    const result = await sendJobMail(validatedData);

    if (result.status == "failed") {
      return handleError("failed", "JOB_MAIL", job, result, data);
    }

    await Activity.create(
      {
        userId: userId,
        message: `Applied for a job as ${validatedData.jobTitle} at ${validatedData.company}`,
        type: "MAIL",
      },
      { transaction: t },
    );

    const newJobId = uuidv4();

    await UserJob.create(
      {
        userId: userId,
        jobId: newJobId,
        status: "applied",
        employerName: validatedData.company,
        jobLocation: job.jobLocation,
        jobTitle: validatedData.jobTitle,
        jobEmploymentType: "unknown",
        jobDescription: validatedData.jobDescription,
        jobIsRemote: false,
        jobHighlights: {},
      },
      { transaction: t },
    );

    await t.commit();

    return {
      status: "success",
      type: "JOB_MAIL",
      jobId: job.id || "unknown",
      response: result.data,
      timestamp: new Date().toISOString(),
      message: "Email sent successfully",
    };
  } catch (error: any) {
    await t.rollback();
    logError(error, {
      file: "worker.ts",
      function: "EmailProcessor",
      line: 100,
    });
    return handleError("failed", "JOB_APPLY", job, error.message, data);
  }
}

export async function AiProcessor(job: any): Promise<ProcessorResponse> {
  const { data } = job;
  const type = job.name as string;
  const userId = data.userId as string;
  const fileId = data.fileId;

  console.log("userId", userId);

  try {
    const response = await jobApply(data.updatedData);

    if (response.statusCode === 200 && type === "JOB_APPLY") {
      return handleJobApply(
        undefined,
        response.response,
        "JOB_APPLY",
        job,
        data,
        fileId,
        userId,
      );
    }
    return handleError("failed", "JOB_APPLY", job, response, data);
  } catch (error: any) {
    logError(error, { file: "worker.ts", function: "AiProcessor", line: 129 });
    return handleError("failed", "JOB_APPLY", job, error.message, data);
  }
}

async function handleJobApply(
  status: "success" = "success",
  response: any,
  type: "JOB_APPLY",
  job: any,
  data: any,
  fileId: string,
  userId: string,
) {
  const parsed = parseResponse(response);
  const resumeJSON = parsed.data.resume;

  await File.update(
    { parsedContent: resumeJSON },
    { where: { id: fileId } },
  );

  const jobTitle = resumeJSON.personal.contactDetails.jobTitle;

  await Activity.create({
    type: "FILE",
    message: `Generated a tailored resume generated for ${jobTitle} `,
    userId: userId,
  });

  return {
    status,
    type,
    jobId: job.id || "unknown",
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
    jobId: job.id || "unknown",
    response: response?.data || response || null,
    fileId: data?.fileId,
    timestamp: new Date().toISOString(),
    message: response?.message || "error",
  };
}

export const getAiQueue = () => aiQueue;
export const getAiWorker = () => aiWorker;
export const getMailQueue = () => mailQueue;
export const getMailWorker = () => mailWorker;

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
    logError(err as Error, {
      file: "worker.ts",
      function: "parseResponse",
      line: 298,
    });
    return { success: false, data: "parsing failed", raw: rawResponse };
  }
};
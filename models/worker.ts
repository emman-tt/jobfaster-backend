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
});

interface ProcessorResponse {
  status: boolean;
  response: string;
  timestamp: string;
  jobId: string;
}
async function delay(seconds: number) {
  await new Promise((resolve) => setTimeout(resolve, seconds));
}

export async function Processor(job: any): Promise<ProcessorResponse> {
  const { data, jobId } = job;

  try {
    const response = await talktoAi(data);

    console.log(response);
    return {
      status: true,
      jobId,
      response: response,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      response: "Failed to process the cv",
      timestamp: new Date().toISOString(),
      jobId,
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
const aiWorker = new Worker("ai", Processor, { connection });

aiWorker.on("completed", (job, result) => {
  console.log(`AI JOB ${job?.id} COMPLETED!`);
  console.log(`   Result:`, result);
});

aiWorker.on("failed", (job, error) => {
  console.log(`AI JOB ${job?.id} FAILED!`);
  console.log(`   Error:`, error.message);
});

aiWorker.on("active", (job) => {
  console.log(`AI JOB ${job?.id} STARTED `);
});

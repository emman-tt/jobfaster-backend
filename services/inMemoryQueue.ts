import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

interface JobData {
  [key: string]: any;
}

interface Job {
  id: string;
  name: string;
  data: JobData;
  queueName: string;
  returnvalue?: any;
  failedReason?: string;
}

interface QueueOptions {
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: string;
      delay: number;
    };
  };
}

interface WorkerOptions {
  drainDelay?: number;
  removeOnFail?: { count: number };
  removeOnComplete?: { count: number };
}

type Processor = (job: Job) => Promise<any>;

class InMemoryQueue {
  name: string;
  private jobs: Map<string, Job> = new Map();
  private pendingJobs: string[] = [];
  private workers: InMemoryWorker[] = [];
  private jobIdCounter = 0;

  constructor(name: string, options?: QueueOptions) {
    this.name = name;
  }

  async add(name: string, data: JobData): Promise<Job> {
    const id = String(++this.jobIdCounter);
    const job: Job = {
      id,
      name,
      data,
      queueName: this.name,
    };

    this.jobs.set(id, job);
    this.pendingJobs.push(id);

    setImmediate(() => this.processNextJob());

    return job;
  }

  processNextJob() {
    if (this.pendingJobs.length === 0) return;

    const availableWorker = this.workers.find(w => !w.isProcessing);
    if (!availableWorker) return;

    const jobId = this.pendingJobs.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job) return;

    availableWorker.process(job);
  }

  registerWorker(worker: InMemoryWorker) {
    this.workers.push(worker);
    setImmediate(() => this.processNextJob());
  }

  emit(event: string, ...args: any[]) {
    this.workers.forEach(w => w.emit(event, ...args));
  }
}

class InMemoryWorker extends EventEmitter {
  queueName: string;
  private processor: Processor;
  private queue: InMemoryQueue;
  isProcessing = false;

  constructor(
    queueName: string,
    processor: Processor,
    options?: WorkerOptions,
    existingQueue?: InMemoryQueue,
  ) {
    super();
    this.queueName = queueName;
    this.processor = processor;
    this.queue = existingQueue || getOrCreateQueue(queueName);
    this.queue.registerWorker(this);
  }

  async process(job: Job) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      this.emit("active", job);
      const result = await this.processor(job);
      job.returnvalue = result;
      this.emit("completed", job, result);
    } catch (error: any) {
      job.failedReason = error?.message || String(error);
      this.emit("failed", job, error);
    } finally {
      this.isProcessing = false;
      setImmediate(() => this.queue.processNextJob());
    }
  }
}

const globalQueues: Map<string, InMemoryQueue> = new Map();
const globalWorkers: Map<string, InMemoryWorker> = new Map();

function getOrCreateQueue(name: string): InMemoryQueue {
  if (!globalQueues.has(name)) {
    globalQueues.set(name, new InMemoryQueue(name));
  }
  return globalQueues.get(name)!;
}

export const createInMemoryQueue = (name: string, options?: QueueOptions) => {
  return getOrCreateQueue(name);
};

export const createInMemoryWorker = (
  queueName: string,
  processor: Processor,
  options?: WorkerOptions,
) => {
  if (globalWorkers.has(queueName)) {
    return globalWorkers.get(queueName)!;
  }
  const worker = new InMemoryWorker(queueName, processor, options);
  globalWorkers.set(queueName, worker);
  return worker;
};

export const getInMemoryQueue = (name: string) => globalQueues.get(name) || null;
export const getInMemoryWorker = (name: string) => globalWorkers.get(name) || null;

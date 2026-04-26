import Websocket, { WebSocketServer } from "ws";
import {
  connection,
  getAiQueue,
  getAiWorker,
  onWorkerReady,
} from "./worker.js";
import { WebSocket } from "ws";
import { uploadResume } from "../controllers/Program/file.js";
import { Parse } from "./pdfParsee.js";

export const socket = new WebSocketServer({ port: 5000 });

const clients = new Set<WebSocket>();

socket.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  clients.add(ws);

  ws.send(
    JSON.stringify({
      type: "connected",
      message: "JobFaster connected from be",
    }),
  );

  ws.on("message", async (dataInput) => {
    const input = dataInput.toString();
    const parsed = JSON.parse(input);
    const { type, data } = parsed;

    console.log(data, type);

    try {
      await connection.connect().catch((err) => {
        console.error("Failed to connect to Redis:", err);
      });
      const aiQueue = getAiQueue();
      if (!aiQueue) {
        throw new Error("Queue not initialized, Redis unavailable");
      }
      const dataText = await ParseOnlinePdf(data.downloadUrl);
      const job = await aiQueue.add(type, { dataText });
      console.log(` Job ${job.id} added to queue`);
    } catch (error: any) {
      console.error("Failed to add job:", error);
      ws.send(
        JSON.stringify({
          type: "JOB_APPLY",
          status: "failed",
          message: error.message,
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

onWorkerReady((queue, worker) => {
  worker.on("completed", (job, result) => {
    console.log(` Job ${job.id} completed`);
    const message = JSON.stringify(result);

    clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });

  worker.on("active", (job) => {
    console.log(` Job ${job.id} started`);
    const message = JSON.stringify({ type: "active", jobId: job.id });

    clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });

  worker.on("failed", (job, error) => {
    console.log(` Job ${job?.id} failed:`, error.message);
    const message = JSON.stringify({
      type: "failed",
      jobId: job?.id,
      error: error.message,
    });

    clients.forEach((ws: any) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });
});

async function ParseOnlinePdf(fileUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const result = await Parse(buffer);
    console.log(result?.text);
    return result?.text;
  } catch (error) {
    console.log(error);
  }
}

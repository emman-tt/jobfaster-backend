import { WebSocket } from "ws";
export async function sendSocketError(
  ws: WebSocket,
  error: any,
  errorMessage: string,
  type: "JOB_APPLY" | "JOB_MAIL" | string,
) {
  console.error("Failed to add job:", error);
  ws.send(
    JSON.stringify({
      type: type,
      status: "failed",
      message: errorMessage,
    }),
  );
}

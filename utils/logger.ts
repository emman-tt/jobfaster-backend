export function logError(error: Error, context: { file: string; function: string; line: number }) {
  console.error(JSON.stringify({
    level: "error",
    message: error.message,
    file: context.file,
    function: context.function,
    line: context.line,
    stack: error.stack,
    timestamp: new Date().toISOString()
  }));
}

export function logInfo(message: string, context?: Record<string, any>) {
  console.log(JSON.stringify({
    level: "info",
    message,
    ...context,
    timestamp: new Date().toISOString()
  }));
}
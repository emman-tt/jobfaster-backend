export function logError(error: Error, context: { file: string; function: string; line: number }) {
  console.error(JSON.stringify({
    message: error.message,
    file: context.file,
    function: context.function,
    line: context.line,
    stack: error.stack,
    timestamp: new Date().toISOString()
  }));
}
type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  context?: string;
  data?: any;
  error?: any;
}

class Logger {
  private static instance: Logger;
  private isDev = import.meta.env.DEV;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]${payload.context ? ` [${payload.context}]` : ""}`;

    const args = [prefix, payload.message];
    if (payload.data) args.push(payload.data);
    if (payload.error) args.push(payload.error);

    switch (level) {
      case "info":
        console.log(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
        console.error(...args);
        break;
      case "debug":
        if (this.isDev) console.debug(...args);
        break;
    }

    // Future extension: Send to Sentry or remote logging service
  }

  info(message: string, context?: string, data?: any) {
    this.log("info", { message, context, data });
  }

  warn(message: string, context?: string, data?: any) {
    this.log("warn", { message, context, data });
  }

  error(message: string, context?: string, error?: any, data?: any) {
    this.log("error", { message, context, error, data });
  }

  debug(message: string, context?: string, data?: any) {
    this.log("debug", { message, context, data });
  }
}

export const logger = Logger.getInstance();

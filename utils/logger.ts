/**
 * Production-safe logger utility
 * Only logs in development mode
 */

import { IS_DEVELOPMENT } from "@/config/env";

const isDevelopment = __DEV__ || IS_DEVELOPMENT;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, you could send to a logging service
    // Example: Sentry.captureException(error);
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};


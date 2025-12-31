/**
 * Production-safe logging utility
 * Automatically disables debug logs in production
 * Provides structured logging with consistent formatting
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LOG_LEVEL = import.meta.env.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

/**
 * Logger utility with production-safe logging
 */
export const logger = {
  /**
   * Debug level logging (disabled in production)
   */
  debug: (message, ...args) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Info level logging
   */
  info: (message, ...args) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Warning level logging
   */
  warn: (message, ...args) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Error level logging with optional error reporting
   */
  error: (message, ...args) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);

      // In production, send errors to error reporting service
      if (import.meta.env.PROD) {
        reportError(message, args);
      }
    }
  },

  /**
   * Log with timestamp and context
   */
  logWithContext: (level, context, message, ...args) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${context}] ${message}`;

    switch (level) {
      case 'debug':
        logger.debug(formattedMessage, ...args);
        break;
      case 'info':
        logger.info(formattedMessage, ...args);
        break;
      case 'warn':
        logger.warn(formattedMessage, ...args);
        break;
      case 'error':
        logger.error(formattedMessage, ...args);
        break;
      default:
        logger.info(formattedMessage, ...args);
    }
  }
};

/**
 * Error reporting function (placeholder for actual error reporting service)
 */
function reportError(message, args) {
  // Placeholder for error reporting service integration
  // Example: Sentry, LogRocket, etc.
  try {
    // Could send to error reporting service here
    console.error('Error reported:', { message, args, timestamp: new Date().toISOString() });
  } catch (reportingError) {
    // Prevent infinite loops if error reporting itself fails
    console.error('Failed to report error:', reportingError);
  }
}

/**
 * Performance logging utility
 */
export const performanceLogger = {
  /**
   * Log performance timing
   */
  time: (label) => {
    if (!import.meta.env.PROD) {
      console.time(label);
    }
  },

  /**
   * End performance timing
   */
  timeEnd: (label) => {
    if (!import.meta.env.PROD) {
      console.timeEnd(label);
    }
  },

  /**
   * Log performance mark
   */
  mark: (name) => {
    if (!import.meta.env.PROD && performance.mark) {
      performance.mark(name);
    }
  }
};

export default logger;
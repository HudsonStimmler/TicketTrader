interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (meta && this.isDevelopment) {
      return `${baseMessage} ${JSON.stringify(meta, null, 2)}`;
    }
    
    return baseMessage;
  }

  error(message: string, meta?: any): void {
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
  }

  info(message: string, meta?: any): void {
    console.info(this.formatMessage(LOG_LEVELS.INFO, message, meta));
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
export default logger;
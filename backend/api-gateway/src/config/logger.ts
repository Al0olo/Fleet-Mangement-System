import winston from 'winston';

/**
 * Creates and configures a winston logger instance
 * @param serviceName Name of the service for default meta
 * @returns Configured logger instance
 */
export function createLogger(serviceName = 'api-gateway'): winston.Logger {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(info => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
          })
        ),
      }),
      // Add file logging in production
      ...(process.env.NODE_ENV === 'production' ? [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
      ] : [])
    ],
  });
}

export default createLogger; 
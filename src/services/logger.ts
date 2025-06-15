import winston from 'winston';
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

// Create the logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define the log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Create a logger instance
const logger = winston.createLogger({
  level: 'info', // Default log level
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Add colors to console output
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info' // Log level for file transport
    })
  ],
  exitOnError: false // Do not exit on handled exceptions
});

export default logger;

import { LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as path from 'path';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logDirectory = './logs';

// Create log directory if it does not exist.
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logFile = path.join(logDirectory, 'server');

const customFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:MM:SS' }),
  winston.format.prettyPrint(),
  winston.format.simple(),
  nestWinstonModuleUtilities.format.nestLike('ORDER PAYMENT ENGINE')
);

export function setupLogger(): LoggerService {
  return WinstonModule.createLogger({
    format: customFormat,
    transports: [
      new winston.transports.Console(),

      new DailyRotateFile({
        filename: `${logFile}.log-%DATE%`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: '30d',
        createSymlink: true,
        symlinkName: 'server.log',
      }),
    ],
  });
}

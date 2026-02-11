import pino from 'pino';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'token',
  'apiKey',
  'secret'
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]'
  },
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});

export type AppLogger = typeof logger;

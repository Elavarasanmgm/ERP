const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
const isVercel = Boolean(process.env.VERCEL);

if (!isVercel && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = logLevels[process.env.LOG_LEVEL || 'debug'];

const formatLog = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${meta}`;
};

const writeLog = (level, message, meta) => {
  const logMessage = formatLog(level, message, meta);
  console.log(logMessage);

  if (!isVercel) {
    const logFile = path.join(logsDir, `${level}.log`);
    fs.appendFileSync(logFile, logMessage + '\n');
  }
};

const logger = {
  debug: (message, meta) => {
    if (currentLogLevel <= logLevels.debug) writeLog('debug', message, meta);
  },
  info: (message, meta) => {
    if (currentLogLevel <= logLevels.info) writeLog('info', message, meta);
  },
  warn: (message, meta) => {
    if (currentLogLevel <= logLevels.warn) writeLog('warn', message, meta);
  },
  error: (message, meta) => {
    if (currentLogLevel <= logLevels.error) writeLog('error', message, meta);
  },
};

module.exports = logger;

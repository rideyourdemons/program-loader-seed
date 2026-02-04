import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "../logs");
const logFile = path.join(logsDir, "app.log");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = (process.env.LOG_LEVEL || "INFO").toUpperCase();

function shouldLog(level) {
  return logLevels[level] <= (logLevels[currentLevel] ?? logLevels.INFO);
}

function formatLogMessage(level, message, args) {
  const timestamp = new Date().toISOString();
  const suffix = args.length > 0
    ? " " + args.map(arg => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")
    : "";
  return `[${level}] ${timestamp} - ${message}${suffix}\n`;
}

function writeToFile(level, message, args) {
  try {
    fs.appendFileSync(logFile, formatLogMessage(level, message, args), "utf8");
  } catch (error) {
    console.error(`[LOGGER ERROR] Failed to write to log file: ${error.message}`);
  }
}

export const logger = {
  error: (message, ...args) => {
    if (shouldLog("ERROR")) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
      writeToFile("ERROR", message, args);
    }
  },
  warn: (message, ...args) => {
    if (shouldLog("WARN")) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
      writeToFile("WARN", message, args);
    }
  },
  info: (message, ...args) => {
    if (shouldLog("INFO")) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
      writeToFile("INFO", message, args);
    }
  },
  debug: (message, ...args) => {
    if (shouldLog("DEBUG")) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
      writeToFile("DEBUG", message, args);
    }
  }
};

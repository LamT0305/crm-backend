import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "logs.txt"); // Log file location

export const logger = (message, level = "INFO") => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;

  console.log(logMessage); // Print to console

  // Save to a log file
  fs.appendFileSync(logFile, logMessage, "utf8");
};

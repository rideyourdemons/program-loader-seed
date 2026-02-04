import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import readOnlyMode from "./readonly-mode.js";

/**
 * Navigation Controller
 * Minimal local implementation for testing and auditing.
 */
class NavigationController {
  constructor() {
    this.activeSessions = new Map();
  }

  async initLocalSession() {
    const sessionId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.activeSessions.set(sessionId, {
      type: "local",
      status: "active"
    });
    logger.info(`Local session initialized: ${sessionId}`);
    return sessionId;
  }

  async readCode(sessionId, filePath) {
    const content = await fs.promises.readFile(filePath, "utf8");
    auditSystem.recordFileRead(filePath, content.length);
    return content;
  }

  async listFiles(sessionId, dirPath) {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory()
    }));
  }

  async writeCode(sessionId, filePath, content, reason = "Local write") {
    if (!readOnlyMode.isAuthorized("write_code", filePath)) {
      auditSystem.recordWriteAttempt(filePath, reason);
      throw new Error(`Write operation not authorized. Target: ${filePath}`);
    }

    await fs.promises.writeFile(filePath, content, "utf8");
    auditSystem.recordAuthorizedWrite(filePath, content.length);
    logger.info(`Local file written: ${filePath}`);
    return { status: "implemented", filePath, size: content.length };
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const langMap = {
      ".js": "javascript",
      ".jsx": "javascript",
      ".ts": "typescript",
      ".tsx": "typescript",
      ".py": "python",
      ".html": "html",
      ".css": "css",
      ".json": "json"
    };
    return langMap[ext] || "unknown";
  }
}

export const navigationController = new NavigationController();
export default navigationController;

import { logger } from "../../core/logger.js";
import navigationController from "../../core/navigation-controller.js";
import credentialManager from "../../core/credential-manager.js";

/**
 * Remote Access Program
 * Provides secure access to websites and backends
 * Credentials are never saved - only stored in memory during session
 */
export default async function run() {
  logger.info("Remote access system initialized");
  logger.info("Ready to accept session credentials and navigation commands");
  
  // Log available sessions on startup
  const sessions = credentialManager.listSessions();
  if (sessions.length > 0) {
    logger.info(`Active sessions: ${sessions.length}`);
    sessions.forEach(session => {
      logger.info(`  - ${session.sessionId}: ${session.type} (${session.url || session.endpoint || session.host})`);
    });
  } else {
    logger.info("No active sessions. Use navigationController to create sessions.");
  }

  // Export controller for use by other modules/scripts
  // This allows external scripts to use the navigation controller
  global.navigationController = navigationController;
  global.credentialManager = credentialManager;

  logger.info("Remote access system ready");
  logger.info("Available methods:");
  logger.info("  - navigationController.initWebsiteSession(credentials, options)");
  logger.info("  - navigationController.initAPISession(credentials, options)");
  logger.info("  - navigationController.initSSHSession(credentials)");
  logger.info("  - navigationController.readCode(sessionId, filePath)");
  logger.info("  - navigationController.writeCode(sessionId, filePath, content)");
  logger.info("  - navigationController.navigateTo(sessionId, url)");
  logger.info("  - navigationController.closeSession(sessionId)");

  // Keep program running
  // Sessions are managed externally
}


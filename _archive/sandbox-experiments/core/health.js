import { state, getState } from "./state.js";
import { getAllPrograms } from "./registry.js";
import { logger } from "./logger.js";

export function getHealthStatus() {
  const stateSnapshot = getState();
  const programs = getAllPrograms();
  
  const health = {
    status: "healthy",
    uptime: stateSnapshot.uptime,
    timestamp: Date.now(),
    programs: {
      total: programs.length,
      loaded: state.programsLoaded.length,
      running: 0,
      errors: 0,
      details: {}
    },
    errors: state.errors.length
  };
  
  // Check program statuses
  for (const programName of programs) {
    const programStatus = state.programsRunning.get(programName);
    const status = programStatus ? programStatus.status : "unknown";
    
    health.programs.details[programName] = {
      status,
      loaded: state.programsLoaded.some(p => p.name === programName)
    };
    
    if (status === "running") {
      health.programs.running++;
    } else if (status === "error") {
      health.programs.errors++;
      health.status = "degraded";
    }
  }
  
  // Overall health status
  if (health.errors > 0 && health.programs.errors === health.programs.total) {
    health.status = "unhealthy";
  }
  
  return health;
}

export function logHealthStatus() {
  const health = getHealthStatus();
  logger.info(`Health Status: ${health.status.toUpperCase()}`);
  logger.info(`Uptime: ${(health.uptime / 1000).toFixed(2)}s`);
  logger.info(`Programs: ${health.programs.running}/${health.programs.total} running`);
  
  if (health.programs.errors > 0) {
    logger.warn(`Programs with errors: ${health.programs.errors}`);
  }
  
  if (health.errors > 0) {
    logger.warn(`Total errors: ${health.errors}`);
  }
}


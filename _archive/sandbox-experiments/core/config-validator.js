import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function validateAppConfig(config) {
  const required = ["appName", "environment"];
  const missing = required.filter(field => !config[field]);
  
  if (missing.length > 0) {
    throw new Error(`app.config.json missing required fields: ${missing.join(", ")}`);
  }
  
  const validEnvironments = ["local", "development", "staging", "production"];
  if (!validEnvironments.includes(config.environment)) {
    logger.warn(`Unknown environment: ${config.environment}. Valid: ${validEnvironments.join(", ")}`);
  }
  
  return true;
}

export function validateProgramsConfig(config) {
  if (!config.enabledPrograms || !Array.isArray(config.enabledPrograms)) {
    throw new Error("programs.config.json must have 'enabledPrograms' as an array");
  }
  
  return true;
}

export async function validateConfigFiles() {
  try {
    const appConfigPath = path.join(__dirname, "../config/app.config.json");
    const programsConfigPath = path.join(__dirname, "../config/programs.config.json");
    
    // Validate app config
    if (fs.existsSync(appConfigPath)) {
      const appConfigContent = await fs.promises.readFile(appConfigPath, "utf-8");
      const appConfig = JSON.parse(appConfigContent);
      validateAppConfig(appConfig);
      logger.debug("app.config.json validated");
    } else {
      logger.warn("app.config.json not found");
    }
    
    // Validate programs config
    if (fs.existsSync(programsConfigPath)) {
      const programsConfigContent = await fs.promises.readFile(programsConfigPath, "utf-8");
      const programsConfig = JSON.parse(programsConfigContent);
      validateProgramsConfig(programsConfig);
      logger.debug("programs.config.json validated");
    } else {
      throw new Error("programs.config.json is required");
    }
    
    return true;
  } catch (error) {
    logger.error("Configuration validation failed:", error.message);
    throw error;
  }
}


import fs from "fs";
import path from "path";
import { registerProgram } from "./registry.js";
import { logger } from "./logger.js";
import { addProgramLoaded, addError } from "./state.js";

function validateManifest(manifest) {
  const required = ["name", "version"];
  const missing = required.filter(field => !manifest[field]);
  
  if (missing.length > 0) {
    throw new Error(`Manifest missing required fields: ${missing.join(", ")}`);
  }
  
  return true;
}

async function loadManifest(programDir) {
  const manifestPath = path.join(programDir, "manifest.json");
  
  if (!fs.existsSync(manifestPath)) {
    logger.warn(`No manifest.json found in ${programDir}, using defaults`);
    return null;
  }
  
  try {
    const manifestContent = await fs.promises.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent);
    validateManifest(manifest);
    return manifest;
  } catch (error) {
    logger.error(`Failed to load manifest from ${manifestPath}:`, error.message);
    throw error;
  }
}

export async function loadPrograms(programsPath, enabledList) {
  logger.info(`Loading ${enabledList.length} program(s)`);
  
  let loadedCount = 0;
  
  for (const programName of enabledList) {
    try {
      const programDir = path.join(programsPath, programName);
      const entryFile = path.join(programDir, "index.js");

      if (!fs.existsSync(entryFile)) {
        logger.warn(`Program not found: ${programName} (looking for ${entryFile})`);
        continue;
      }

      logger.debug(`Loading program: ${programName}`);
      
      // Load manifest if available
      let metadata = {};
      try {
        const manifest = await loadManifest(programDir);
        if (manifest) {
          metadata = manifest;
        }
      } catch (error) {
        logger.warn(`Could not load manifest for ${programName}, continuing without it`);
      }

      // Load the program module
      const module = await import(`file://${path.resolve(entryFile)}`);
      
      if (!module.default) {
        throw new Error(`Program ${programName} does not export a default function`);
      }

      if (typeof module.default !== "function") {
        throw new Error(`Program ${programName} default export is not a function`);
      }

      registerProgram(programName, module.default, metadata);
      addProgramLoaded(programName);
      loadedCount++;
      logger.info(`Successfully loaded program: ${programName}`);
      
    } catch (error) {
      logger.error(`Failed to load program ${programName}:`, error.message);
      addError(error);
    }
  }
  
  logger.info(`Loaded ${loadedCount} program(s) successfully`);
}

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { loadPrograms } from "../core/loader.js";
import { getHealthStatus } from "../core/health.js";
import { getAllPrograms, getProgramMetadata } from "../core/registry.js";
import programsConfig from "../config/programs.config.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

// Load programs to populate registry (but don't start them)
async function loadProgramsForStatus() {
  try {
    await loadPrograms(
      path.join(__dirname, "../programs"),
      programsConfig.enabledPrograms
    );
  } catch (error) {
    console.error("Error loading programs:", error.message);
  }
}

// Load programs first
await loadProgramsForStatus();

const health = getHealthStatus();
const programs = getAllPrograms();

console.log("\n=== Program Loader Status ===\n");
console.log(`Status: ${health.status.toUpperCase()}`);
console.log(`Uptime: ${(health.uptime / 1000).toFixed(2)} seconds`);
console.log(`Total Errors: ${health.errors}\n`);

console.log("Programs:");
console.log("─".repeat(60));

if (programs.length === 0) {
  console.log("No programs configured or loaded.");
} else {
  programs.forEach(programName => {
    const metadata = getProgramMetadata(programName);
    const programHealth = health.programs.details[programName] || { status: "unknown", loaded: false };
    
    const statusIcon = programHealth.status === "running" ? "✓" : 
                       programHealth.status === "error" ? "✗" : "?";
    
    console.log(`${statusIcon} ${programName}`);
    
    if (metadata && metadata.version) {
      console.log(`   Version: ${metadata.version}`);
    }
    
    if (metadata && metadata.description) {
      console.log(`   Description: ${metadata.description}`);
    }
    
    console.log(`   Status: ${programHealth.status}`);
    console.log(`   Loaded: ${programHealth.loaded ? "Yes" : "No"}`);
    console.log("");
  });
}

if (health.errors > 0) {
  console.log("\nRecent Errors:");
  console.log("─".repeat(60));
  // This would show recent errors if we enhance state to track them with timestamps
  console.log("(Error details available in logs)\n");
}


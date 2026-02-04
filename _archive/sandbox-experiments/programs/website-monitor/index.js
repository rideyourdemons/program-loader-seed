import axios from "axios";
import appConfig from "../../config/app.config.json" with { type: "json" };
import { logger } from "../../core/logger.js";
import { addError } from "../../core/state.js";

// Get website URL from environment variable or config
const websiteUrl = process.env.WEBSITE_URL || appConfig.website?.url || "";
const checkInterval = appConfig.website?.checkInterval || 60000;
const timeout = appConfig.website?.timeout || 10000;
const expectedStatus = appConfig.website?.expectedStatus || 200;
const expectedContent = appConfig.website?.expectedContent || [];

// Validate URL format
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Perform basic HTTP check
async function performBasicCheck(url) {
  const startTime = Date.now();
  try {
    const response = await axios.get(url, {
      timeout,
      validateStatus: () => true, // Don't throw on any status code
      maxRedirects: 5
    });
    
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    const isHealthy = statusCode === expectedStatus;
    
    return {
      success: isHealthy,
      statusCode,
      responseTime,
      headers: response.headers,
      contentLength: response.data?.length || 0
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.code === "ECONNABORTED") {
      return {
        success: false,
        error: "Timeout",
        responseTime,
        message: `Request timed out after ${timeout}ms`
      };
    } else if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") {
      return {
        success: false,
        error: "DNS Error",
        responseTime,
        message: `DNS resolution failed: ${error.message}`
      };
    } else if (error.code === "ECONNREFUSED") {
      return {
        success: false,
        error: "Connection Refused",
        responseTime,
        message: `Connection refused: ${error.message}`
      };
    } else {
      return {
        success: false,
        error: "Network Error",
        responseTime,
        message: error.message
      };
    }
  }
}

// Perform content validation check
function performContentCheck(html, expectedContent) {
  if (!expectedContent || expectedContent.length === 0) {
    return { success: true, checks: [] };
  }
  
  const checks = expectedContent.map(content => {
    const found = html.includes(content);
    return {
      content,
      found,
      success: found
    };
  });
  
  const allFound = checks.every(check => check.found);
  
  return {
    success: allFound,
    checks
  };
}

// Perform performance check
async function performPerformanceCheck(url) {
  const startTime = Date.now();
  try {
    const response = await axios.get(url, {
      timeout,
      validateStatus: () => true,
      maxRedirects: 5
    });
    
    const loadTime = Date.now() - startTime;
    const contentLength = typeof response.data === "string" 
      ? Buffer.byteLength(response.data, "utf8") 
      : 0;
    
    // Count resources (basic HTML parsing for script, link, img tags)
    let resourceCount = 0;
    if (typeof response.data === "string") {
      const scriptMatches = response.data.match(/<script[^>]*>/gi) || [];
      const linkMatches = response.data.match(/<link[^>]*>/gi) || [];
      const imgMatches = response.data.match(/<img[^>]*>/gi) || [];
      resourceCount = scriptMatches.length + linkMatches.length + imgMatches.length;
    }
    
    return {
      success: true,
      loadTime,
      contentLength,
      resourceCount,
      contentLengthKB: (contentLength / 1024).toFixed(2)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Perform comprehensive website check
async function performWebsiteCheck() {
  if (!websiteUrl) {
    logger.warn("Website URL not configured. Set WEBSITE_URL environment variable or configure in app.config.json");
    return;
  }
  
  if (!isValidUrl(websiteUrl)) {
    logger.error(`Invalid website URL: ${websiteUrl}`);
    addError(new Error(`Invalid website URL: ${websiteUrl}`));
    return;
  }
  
  logger.info(`Starting website check for: ${websiteUrl}`);
  
  try {
    // Basic HTTP check
    const basicCheck = await performBasicCheck(websiteUrl);
    
    if (basicCheck.success) {
      logger.info(`✓ Basic check passed - Status: ${basicCheck.statusCode}, Response time: ${basicCheck.responseTime}ms`);
    } else {
      logger.error(`✗ Basic check failed - ${basicCheck.error || `Status: ${basicCheck.statusCode}`} - ${basicCheck.message || ""}`);
      addError(new Error(`Website check failed: ${basicCheck.error || `Status ${basicCheck.statusCode}`}`));
    }
    
    // Content validation check (only if we got a successful response)
    if (basicCheck.success && basicCheck.statusCode === 200) {
      try {
        const response = await axios.get(websiteUrl, { timeout });
        const html = typeof response.data === "string" ? response.data : "";
        
        const contentCheck = performContentCheck(html, expectedContent);
        
        if (contentCheck.success) {
          if (expectedContent.length > 0) {
            logger.info(`✓ Content check passed - All ${expectedContent.length} expected content items found`);
          }
        } else {
          const missing = contentCheck.checks.filter(c => !c.found).map(c => c.content);
          logger.warn(`✗ Content check failed - Missing: ${missing.join(", ")}`);
        }
      } catch (error) {
        logger.warn(`Content check skipped due to error: ${error.message}`);
      }
    }
    
    // Performance check
    const performanceCheck = await performPerformanceCheck(websiteUrl);
    
    if (performanceCheck.success) {
      logger.info(`✓ Performance check - Load time: ${performanceCheck.loadTime}ms, Size: ${performanceCheck.contentLengthKB}KB, Resources: ${performanceCheck.resourceCount}`);
    } else {
      logger.warn(`✗ Performance check failed: ${performanceCheck.error}`);
    }
    
    // Summary
    const allChecksPassed = basicCheck.success && 
      (!expectedContent.length || (performanceCheck.success && performanceCheck.success));
    
    if (allChecksPassed) {
      logger.info(`✓ All website checks passed for ${websiteUrl}`);
    } else {
      logger.warn(`⚠ Some website checks failed for ${websiteUrl}`);
    }
    
  } catch (error) {
    logger.error(`Website check error: ${error.message}`);
    addError(error);
  }
}

// Main program function
export default async function run() {
  if (!websiteUrl) {
    logger.warn("Website monitor started but no URL configured. Set WEBSITE_URL or configure in app.config.json");
    return;
  }
  
  logger.info(`Website monitor started. Monitoring ${websiteUrl} every ${checkInterval / 1000} seconds`);
  
  // Perform initial check
  await performWebsiteCheck();
  
  // Set up interval for continuous monitoring
  const intervalId = setInterval(async () => {
    await performWebsiteCheck();
  }, checkInterval);
  
  // Keep the program running
  // Note: In a real-world scenario, you might want to handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Website monitor shutting down...");
    clearInterval(intervalId);
    process.exit(0);
  });
  
  process.on("SIGTERM", () => {
    logger.info("Website monitor shutting down...");
    clearInterval(intervalId);
    process.exit(0);
  });
}


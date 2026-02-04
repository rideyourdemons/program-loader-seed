import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import appConfig from "../config/app.config.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

// Get website URL from environment variable or config
const websiteUrl = process.env.WEBSITE_URL || appConfig.website?.url || "";
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
      validateStatus: () => true,
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

// Main check function
async function checkWebsite() {
  console.log("\n=== Website Check ===\n");
  
  if (!websiteUrl) {
    console.error("❌ Website URL not configured.");
    console.error("   Set WEBSITE_URL environment variable or configure in config/app.config.json");
    process.exit(1);
  }
  
  if (!isValidUrl(websiteUrl)) {
    console.error(`❌ Invalid website URL: ${websiteUrl}`);
    process.exit(1);
  }
  
  console.log(`Checking: ${websiteUrl}\n`);
  console.log("─".repeat(60));
  
  let allChecksPassed = true;
  
  try {
    // Basic HTTP check
    console.log("\n[1/3] Basic HTTP Check...");
    const basicCheck = await performBasicCheck(websiteUrl);
    
    if (basicCheck.success) {
      console.log(`✓ Status Code: ${basicCheck.statusCode} (Expected: ${expectedStatus})`);
      console.log(`✓ Response Time: ${basicCheck.responseTime}ms`);
      console.log(`✓ Content Length: ${basicCheck.contentLength} bytes`);
    } else {
      console.log(`✗ ${basicCheck.error || `Status Code: ${basicCheck.statusCode}`}`);
      if (basicCheck.message) {
        console.log(`  ${basicCheck.message}`);
      }
      allChecksPassed = false;
    }
    
    // Content validation check
    if (basicCheck.success && basicCheck.statusCode === 200) {
      console.log("\n[2/3] Content Validation Check...");
      
      if (expectedContent.length === 0) {
        console.log("✓ No content validation configured (skipped)");
      } else {
        try {
          const response = await axios.get(websiteUrl, { timeout });
          const html = typeof response.data === "string" ? response.data : "";
          
          const contentCheck = performContentCheck(html, expectedContent);
          
          if (contentCheck.success) {
            console.log(`✓ All ${expectedContent.length} expected content items found`);
            contentCheck.checks.forEach(check => {
              console.log(`  ✓ Found: "${check.content}"`);
            });
          } else {
            const missing = contentCheck.checks.filter(c => !c.found);
            const found = contentCheck.checks.filter(c => c.found);
            
            found.forEach(check => {
              console.log(`  ✓ Found: "${check.content}"`);
            });
            missing.forEach(check => {
              console.log(`  ✗ Missing: "${check.content}"`);
            });
            allChecksPassed = false;
          }
        } catch (error) {
          console.log(`✗ Content check failed: ${error.message}`);
          allChecksPassed = false;
        }
      }
    } else {
      console.log("\n[2/3] Content Validation Check...");
      console.log("⚠ Skipped (HTTP check failed)");
    }
    
    // Performance check
    console.log("\n[3/3] Performance Check...");
    const performanceCheck = await performPerformanceCheck(websiteUrl);
    
    if (performanceCheck.success) {
      console.log(`✓ Load Time: ${performanceCheck.loadTime}ms`);
      console.log(`✓ Content Size: ${performanceCheck.contentLengthKB} KB`);
      console.log(`✓ Resources Detected: ${performanceCheck.resourceCount} (scripts, links, images)`);
    } else {
      console.log(`✗ Performance check failed: ${performanceCheck.error}`);
      allChecksPassed = false;
    }
    
    // Summary
    console.log("\n" + "─".repeat(60));
    if (allChecksPassed) {
      console.log("\n✓ All checks passed!\n");
      process.exit(0);
    } else {
      console.log("\n⚠ Some checks failed. See details above.\n");
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`\n❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run the check
checkWebsite();


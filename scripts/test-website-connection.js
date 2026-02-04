import axios from "axios";
import { logger } from "../core/logger.js";

const websiteUrl = "https://rideyourdemons.com";

async function testConnection() {
  console.log(`\n=== Testing Connection to ${websiteUrl} ===\n`);

  try {
    const startTime = Date.now();
    const response = await axios.get(websiteUrl, {
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
      maxRedirects: 5
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    console.log(`✓ Connection successful!`);
    console.log(`  Status Code: ${statusCode}`);
    console.log(`  Response Time: ${responseTime}ms`);
    console.log(`  Content Length: ${response.data?.length || 0} bytes`);
    
    if (response.headers['content-type']) {
      console.log(`  Content Type: ${response.headers['content-type']}`);
    }

    // Check if it's HTML
    if (typeof response.data === 'string' && response.data.includes('<!')) {
      console.log(`  Type: HTML Page`);
      
      // Extract title if present
      const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        console.log(`  Page Title: ${titleMatch[1]}`);
      }

      // Check for common frameworks/libraries
      if (response.data.includes('react') || response.data.includes('React')) {
        console.log(`  Framework: React detected`);
      }
      if (response.data.includes('vue') || response.data.includes('Vue')) {
        console.log(`  Framework: Vue detected`);
      }
      if (response.data.includes('angular') || response.data.includes('Angular')) {
        console.log(`  Framework: Angular detected`);
      }
      if (response.data.includes('wordpress') || response.data.includes('wp-content')) {
        console.log(`  Platform: WordPress detected`);
      }

      // Check for login forms
      if (response.data.includes('login') || response.data.includes('password') || 
          response.data.includes('username') || response.data.includes('email')) {
        console.log(`  Login Form: Possibly detected`);
      }
    }

    console.log(`\n✓ Website is accessible and ready for remote access setup\n`);

  } catch (error) {
    console.error(`✗ Connection failed: ${error.message}`);
    if (error.code === 'ENOTFOUND') {
      console.error(`  DNS resolution failed. Check the URL.`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`  Connection refused. Server may be down.`);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`  Request timed out.`);
    }
    process.exit(1);
  }
}

testConnection();


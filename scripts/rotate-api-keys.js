#!/usr/bin/env node

/**
 * API Key Rotation Script
 * Guides through rotating API keys in Firebase and Google Cloud Console
 * 
 * IMPORTANT: This script helps you rotate keys safely. Always:
 * 1. Create new keys before deleting old ones
 * 2. Test new keys work before removing old ones
 * 3. Update all applications using the keys
 * 4. Keep old keys active during transition period
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { logger } from '../core/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Note: Hidden input is complex on Windows, so we'll use regular input
// Users can paste keys directly (they'll be visible but masked in logs)

console.log('\n' + '='.repeat(70));
console.log('API Key Rotation Tool');
console.log('Firebase & Google Cloud Console');
console.log('='.repeat(70) + '\n');

const rotationLog = {
  timestamp: new Date().toISOString(),
  keys: [],
  status: 'in_progress'
};

/**
 * Rotate Firebase Web API Keys
 */
async function rotateFirebaseAPIKeys() {
  console.log('🔑 Firebase Web API Keys Rotation');
  console.log('='.repeat(70) + '\n');
  
  console.log('Firebase Web API keys are used in client-side applications.');
  console.log('You can find and manage them in:');
  console.log('  Firebase Console > Project Settings > General > Your apps\n');
  
  const rotateFirebase = await question('Rotate Firebase Web API keys? (y/n): ');
  if (rotateFirebase !== 'y') {
    console.log('⏭️  Skipping Firebase Web API key rotation\n');
    return;
  }

  console.log('\n📋 Steps to rotate Firebase Web API keys:\n');
  console.log('1. Go to: https://console.firebase.google.com/');
  console.log('2. Select your project');
  console.log('3. Go to Project Settings (gear icon) > General tab');
  console.log('4. Scroll to "Your apps" section');
  console.log('5. For each app (Web, iOS, Android):');
  console.log('   a. Create a new API key if needed (use "Add app")');
  console.log('   b. Copy the new API key');
  console.log('   c. Update your application with the new key');
  console.log('   d. Test the application works with new key');
  console.log('   e. (Optional) Restrict the old key before deleting');
  console.log('   f. Delete the old API key\n');

  const currentKey = await question('Enter current Firebase API key (or press Enter to skip): ');
  if (currentKey) {
    console.log('\n⚠️  Make sure to update this key in your application configuration!\n');
    
    const newKey = await question('Enter new Firebase API key (press Enter when ready): ');
    if (newKey) {
      rotationLog.keys.push({
        type: 'firebase_web_api',
        oldKey: maskKey(currentKey),
        newKey: maskKey(newKey),
        rotated: true,
        timestamp: new Date().toISOString()
      });
      console.log('\n✅ New Firebase API key recorded.');
      console.log('⚠️  Remember to update your application with the new key!\n');
    }
  }

  const updatedConfig = await question('Have you updated your application configuration? (y/n): ');
  if (updatedConfig === 'y') {
    console.log('✅ Configuration updated\n');
  } else {
    console.log('⚠️  Please update your configuration before deleting old keys\n');
  }
}

/**
 * Rotate Google Cloud API Keys
 */
async function rotateGoogleCloudAPIKeys() {
  console.log('\n🔑 Google Cloud API Keys Rotation');
  console.log('='.repeat(70) + '\n');
  
  console.log('Google Cloud API keys are used for various Google services.');
  console.log('You can find and manage them in:');
  console.log('  Google Cloud Console > APIs & Services > Credentials\n');
  
  const rotateGoogle = await question('Rotate Google Cloud API keys? (y/n): ');
  if (rotateGoogle !== 'y') {
    console.log('⏭️  Skipping Google Cloud API key rotation\n');
    return;
  }

  console.log('\n📋 Steps to rotate Google Cloud API keys:\n');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Select your project');
  console.log('3. Navigate to: APIs & Services > Credentials');
  console.log('4. Find your API key in the "API keys" section');
  console.log('5. Click "Create credentials" > "API key" to create new key');
  console.log('6. Copy the new API key');
  console.log('7. Update your application with the new key');
  console.log('8. Test the application works with new key');
  console.log('9. (Recommended) Restrict the old key before deleting');
  console.log('10. Delete the old API key\n');

  const keyName = await question('Enter API key name/description (or press Enter to skip): ');
  if (keyName) {
    const currentKey = await question('Enter current Google Cloud API key (or press Enter to skip): ');
    if (currentKey) {
      console.log('\n⚠️  Make sure to update this key in your application configuration!\n');
      
      const newKey = await question('Enter new Google Cloud API key (press Enter when ready): ');
      if (newKey) {
        rotationLog.keys.push({
          type: 'google_cloud_api',
          name: keyName,
          oldKey: maskKey(currentKey),
          newKey: maskKey(newKey),
          rotated: true,
          timestamp: new Date().toISOString()
        });
        console.log('\n✅ New Google Cloud API key recorded.');
        console.log('⚠️  Remember to update your application with the new key!\n');
      }
    }
  }

  console.log('💡 Tip: Use API key restrictions to limit usage by:');
  console.log('   - Application restrictions (HTTP referrers, IP addresses, Android/iOS apps)');
  console.log('   - API restrictions (limit which APIs can be called)\n');
}

/**
 * Rotate Service Account Keys
 */
async function rotateServiceAccountKeys() {
  console.log('\n🔑 Service Account Keys Rotation');
  console.log('='.repeat(70) + '\n');
  
  console.log('Service account keys are JSON files used for server-side authentication.');
  console.log('You can find and manage them in:');
  console.log('  Google Cloud Console > IAM & Admin > Service Accounts\n');
  
  const rotateServiceAccount = await question('Rotate Service Account keys? (y/n): ');
  if (rotateServiceAccount !== 'y') {
    console.log('⏭️  Skipping service account key rotation\n');
    return;
  }

  console.log('\n📋 Steps to rotate Service Account keys:\n');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Select your project');
  console.log('3. Navigate to: IAM & Admin > Service Accounts');
  console.log('4. Click on the service account you want to rotate');
  console.log('5. Go to the "Keys" tab');
  console.log('6. Click "Add Key" > "Create new key"');
  console.log('7. Choose "JSON" format');
  console.log('8. Download the new JSON key file');
  console.log('9. Save it securely (NOT in git!)');
  console.log('10. Update your application to use the new key file');
  console.log('11. Test the application works with new key');
  console.log('12. Delete the old key in the console\n');

  const serviceAccountEmail = await question('Enter service account email (or press Enter to skip): ');
  if (serviceAccountEmail) {
    // Check if we have a config file that references service account
    const configPath = path.join(__dirname, '../config/firebase-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`\n📄 Found config file: ${configPath}`);
        console.log(`   Current service account path: ${config.serviceAccountPath || 'not set'}\n`);
        
        const updateConfig = await question('Update config file with new service account path? (y/n): ');
        if (updateConfig === 'y') {
          const newPath = await question('Enter path to new service account JSON file: ');
          if (newPath && fs.existsSync(newPath)) {
            // Verify it's a valid service account JSON
            try {
              const newServiceAccount = JSON.parse(fs.readFileSync(newPath, 'utf8'));
              if (newServiceAccount.type === 'service_account') {
                config.serviceAccountPath = newPath;
                config.lastUpdated = new Date().toISOString();
                config.previousPath = config.serviceAccountPath; // Keep old path reference
                
                // Create backup of old config
                const backupPath = configPath + '.backup.' + Date.now();
                fs.copyFileSync(configPath, backupPath);
                console.log(`\n✅ Backup created: ${backupPath}`);
                
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(`✅ Config file updated with new service account path\n`);
                
                rotationLog.keys.push({
                  type: 'service_account',
                  email: serviceAccountEmail,
                  oldPath: config.previousPath,
                  newPath: newPath,
                  rotated: true,
                  timestamp: new Date().toISOString()
                });
              } else {
                console.log('⚠️  File does not appear to be a valid service account JSON\n');
              }
            } catch (error) {
              console.log(`⚠️  Error reading service account file: ${error.message}\n`);
            }
          } else {
            console.log('⚠️  File not found. Please update config manually.\n');
          }
        }
      } catch (error) {
        console.log(`⚠️  Error reading config file: ${error.message}\n`);
      }
    } else {
      console.log('\n💡 Tip: Create config/firebase-config.json to manage service account paths\n');
    }
  }

  console.log('⚠️  SECURITY REMINDERS:');
  console.log('   - Service account keys should NEVER be committed to git');
  console.log('   - Store keys securely (use environment variables or secret managers)');
  console.log('   - Delete old keys immediately after confirming new keys work');
  console.log('   - Use .gitignore to exclude key files\n');
}

/**
 * Verify new keys are working
 */
async function verifyKeys() {
  console.log('\n✅ Key Verification');
  console.log('='.repeat(70) + '\n');
  
  console.log('Before deleting old keys, verify new keys are working:\n');
  console.log('1. Test Firebase connection with new keys');
  console.log('2. Test Google Cloud API calls with new keys');
  console.log('3. Verify all applications are using new keys');
  console.log('4. Monitor for any errors after switching\n');

  const verified = await question('Have you verified all new keys are working? (y/n): ');
  if (verified === 'y') {
    rotationLog.verification = {
      verified: true,
      timestamp: new Date().toISOString()
    };
    console.log('✅ Verification confirmed\n');
  } else {
    console.log('⚠️  Please verify keys before deleting old ones\n');
    rotationLog.verification = {
      verified: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Cleanup old keys
 */
async function cleanupOldKeys() {
  console.log('\n🗑️  Old Key Cleanup');
  console.log('='.repeat(70) + '\n');
  
  console.log('⚠️  IMPORTANT: Only delete old keys after:');
  console.log('   1. New keys are created and tested');
  console.log('   2. All applications are updated');
  console.log('   3. No errors for at least 24-48 hours\n');

  const cleanup = await question('Delete old keys now? (y/n, recommended: n for first run): ');
  if (cleanup !== 'y') {
    console.log('⏭️  Skipping cleanup. Delete old keys manually after verification period.\n');
    rotationLog.cleanup = {
      performed: false,
      timestamp: new Date().toISOString(),
      note: 'Manual cleanup recommended after verification period'
    };
    return;
  }

  console.log('\n📋 Manual cleanup steps:\n');
  console.log('Firebase Web API Keys:');
  console.log('  1. Firebase Console > Project Settings > General');
  console.log('  2. Find old API key');
  console.log('  3. Delete the key\n');
  
  console.log('Google Cloud API Keys:');
  console.log('  1. Google Cloud Console > APIs & Services > Credentials');
  console.log('  2. Find old API key');
  console.log('  3. Click on key > Delete\n');
  
  console.log('Service Account Keys:');
  console.log('  1. Google Cloud Console > IAM & Admin > Service Accounts');
  console.log('  2. Select service account > Keys tab');
  console.log('  3. Find old key > Delete\n');

  rotationLog.cleanup = {
    performed: true,
    timestamp: new Date().toISOString(),
    note: 'Cleanup performed manually'
  };
}

/**
 * Mask API key for logging (show only first/last few characters)
 */
function maskKey(key) {
  if (!key || key.length < 8) {
    return '****';
  }
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

/**
 * Main rotation process
 */
async function main() {
  try {
    // Rotate Firebase API keys
    await rotateFirebaseAPIKeys();
    
    // Rotate Google Cloud API keys
    await rotateGoogleCloudAPIKeys();
    
    // Rotate Service Account keys
    await rotateServiceAccountKeys();
    
    // Verify new keys
    await verifyKeys();
    
    // Cleanup old keys
    await cleanupOldKeys();
    
    // Save rotation log
    rotationLog.status = 'completed';
    const logsDir = path.join(__dirname, '../logs/key-rotation');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(
      logsDir,
      `key-rotation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    
    fs.writeFileSync(logFile, JSON.stringify(rotationLog, null, 2));
    console.log('\n' + '='.repeat(70));
    console.log('Rotation Summary');
    console.log('='.repeat(70));
    console.log(`Keys rotated: ${rotationLog.keys.length}`);
    console.log(`Status: ${rotationLog.status}`);
    console.log(`Log saved: ${logFile}\n`);
    
    console.log('📚 Helpful Links:');
    console.log('   Firebase Console: https://console.firebase.google.com/');
    console.log('   Google Cloud Console: https://console.cloud.google.com/');
    console.log('   Firebase Docs: https://firebase.google.com/docs');
    console.log('   Google Cloud Docs: https://cloud.google.com/docs\n');
    
    console.log('✅ Key rotation process complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during key rotation:', error.message);
    rotationLog.status = 'failed';
    rotationLog.error = error.message;
    
    // Save error log
    const logsDir = path.join(__dirname, '../logs/key-rotation');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const errorLogFile = path.join(
      logsDir,
      `key-rotation-error-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    
    fs.writeFileSync(errorLogFile, JSON.stringify(rotationLog, null, 2));
    console.error(`📄 Error log saved: ${errorLogFile}\n`);
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run rotation
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


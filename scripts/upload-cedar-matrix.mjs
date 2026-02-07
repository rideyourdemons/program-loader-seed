/**
 * Upload Cedar Matrix to Firestore
 * Production-safe batch upload with error handling
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, collection } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Firebase Config (update with your actual config)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "rideyourdemons.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "rideyourdemons",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "rideyourdemons.appspot.com",
};

// Validate config
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.error('❌ Error: Firebase API key not configured.');
  console.error('   Set FIREBASE_API_KEY environment variable or update firebaseConfig in script.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Load matrix data from file or use provided data
 */
function loadMatrixData(dataPath) {
  if (dataPath && existsSync(dataPath)) {
    try {
      const content = readFileSync(dataPath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`❌ Error loading matrix data from ${dataPath}:`, err.message);
      return null;
    }
  }
  return null;
}

/**
 * Upload Cedar Matrix to Firestore
 */
async function uploadCedarMatrix(matrixData, collectionName = 'cedar_matrix') {
  if (!matrixData || !Array.isArray(matrixData) || matrixData.length === 0) {
    console.error('❌ Error: Matrix data must be a non-empty array');
    return false;
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  UPLOADING CEDAR MATRIX TO FIRESTORE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Collection: ${collectionName}`);
  console.log(`Items: ${matrixData.length}`);
  console.log('');

  // Firestore batch limit is 500 operations
  const BATCH_SIZE = 500;
  let totalUploaded = 0;
  let totalBatches = Math.ceil(matrixData.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, matrixData.length);
    const batchData = matrixData.slice(startIndex, endIndex);

    console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (items ${startIndex + 1}-${endIndex})...`);

    try {
      const batch = writeBatch(db);

      batchData.forEach((item, index) => {
        // Create unique document ID
        const docId = item.id || item.slug || `item_${startIndex + index}`;
        const docRef = doc(db, collectionName, docId);
        
        // Add metadata
        const itemWithMetadata = {
          ...item,
          uploaded_at: new Date().toISOString(),
          batch_index: batchIndex,
          where_it_came_from: item.where_it_came_from || {
            origin: "internal",
            basis: "Cedar Matrix upload",
            source_type: "firestore-upload",
            verified: true
          }
        };
        
        batch.set(docRef, itemWithMetadata);
      });

      await batch.commit();
      totalUploaded += batchData.length;
      console.log(`  ✅ Batch ${batchIndex + 1} uploaded (${batchData.length} items)`);
    } catch (error) {
      console.error(`  ❌ Batch ${batchIndex + 1} failed:`, error.message);
      return false;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ SUCCESS! ${totalUploaded} items uploaded to Firestore`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  return true;
}

/**
 * Main execution
 */
async function main() {
  // Check for command line arguments
  const args = process.argv.slice(2);
  const dataPath = args[0] || null;
  const collectionName = args[1] || 'cedar_matrix';

  let matrixData = null;

  // Try to load from file if path provided
  if (dataPath) {
    const fullPath = dataPath.startsWith('/') ? dataPath : join(ROOT_DIR, dataPath);
    matrixData = loadMatrixData(fullPath);
  }

  // If no file provided, check common locations
  if (!matrixData) {
    const commonPaths = [
      join(ROOT_DIR, 'RYD_MATRIX', 'cedar-matrix.json'),
      join(ROOT_DIR, 'data', 'cedar-matrix.json'),
      join(ROOT_DIR, 'public', 'data', 'cedar-matrix.json')
    ];

    for (const path of commonPaths) {
      if (existsSync(path)) {
        console.log(`Found matrix data at: ${path}`);
        matrixData = loadMatrixData(path);
        if (matrixData) break;
      }
    }
  }

  if (!matrixData) {
    console.error('❌ Error: No matrix data found.');
    console.error('');
    console.error('Usage:');
    console.error('  node scripts/upload-cedar-matrix.mjs [data-file-path] [collection-name]');
    console.error('');
    console.error('Or set matrix data in the script or provide a file path.');
    process.exit(1);
  }

  // Normalize data structure
  if (!Array.isArray(matrixData)) {
    // If it's an object with a data property, extract it
    if (matrixData.data && Array.isArray(matrixData.data)) {
      matrixData = matrixData.data;
    } else if (matrixData.matrix && Array.isArray(matrixData.matrix)) {
      matrixData = matrixData.matrix;
    } else {
      // Wrap single object in array
      matrixData = [matrixData];
    }
  }

  const success = await uploadCedarMatrix(matrixData, collectionName);
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { uploadCedarMatrix, loadMatrixData };

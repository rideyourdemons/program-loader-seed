/**
 * Fix Pain Points Script
 * 
 * Normalizes pain-points.json by ensuring each pain point has a toolIds array.
 * If a pain point lacks toolIds, assigns 3 random tool IDs from the base tools list.
 */

const fs = require('fs');
const path = require('path');

const PAIN_POINTS_FILE = path.join(__dirname, '..', 'public', 'data', 'pain-points.json');
const TOOLS_FILE = path.join(__dirname, '..', 'public', 'data', 'tools.json');

function fixPainPoints() {
  console.log('[FIX] Fixing pain points...\n');

  // Read files
  if (!fs.existsSync(PAIN_POINTS_FILE)) {
    console.error(`[FIX] ERROR: ${PAIN_POINTS_FILE} not found`);
    process.exit(1);
  }

  if (!fs.existsSync(TOOLS_FILE)) {
    console.error(`[FIX] ERROR: ${TOOLS_FILE} not found`);
    console.error('[FIX] Run "npm run build:tools" first to generate tools.json');
    process.exit(1);
  }

  const painPointsData = JSON.parse(fs.readFileSync(PAIN_POINTS_FILE, 'utf8'));
  const toolsData = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));

  const painPoints = painPointsData.painPoints || {};
  const tools = toolsData.tools || [];

  if (tools.length === 0) {
    console.error('[FIX] ERROR: No tools found in tools.json');
    process.exit(1);
  }

  // Get all tool IDs
  const toolIds = tools
    .map(tool => tool.id || tool.slug)
    .filter(id => id); // Remove null/undefined

  if (toolIds.length === 0) {
    console.error('[FIX] ERROR: No valid tool IDs found');
    process.exit(1);
  }

  console.log(`[FIX] Found ${toolIds.length} tools`);
  console.log(`[FIX] Processing ${Object.keys(painPoints).length} gates\n`);

  let fixed = 0;
  let alreadyHadTools = 0;
  let totalPainPoints = 0;

  // Process each gate
  Object.keys(painPoints).forEach(gateId => {
    const gatePainPoints = painPoints[gateId] || [];

    gatePainPoints.forEach(painPoint => {
      totalPainPoints++;

      // Check if pain point already has toolIds
      if (Array.isArray(painPoint.toolIds) && painPoint.toolIds.length > 0) {
        alreadyHadTools++;
        return; // Skip if already has toolIds
      }

      // Check legacy 'tools' array
      if (Array.isArray(painPoint.tools) && painPoint.tools.length > 0) {
        // Migrate 'tools' to 'toolIds'
        painPoint.toolIds = painPoint.tools;
        delete painPoint.tools;
        fixed++;
        console.log(`[FIX] Migrated 'tools' to 'toolIds' for: ${gateId}/${painPoint.id}`);
        return;
      }

      // Assign 3 random tool IDs
      const shuffled = [...toolIds].sort(() => Math.random() - 0.5);
      painPoint.toolIds = shuffled.slice(0, 3);

      fixed++;
      console.log(`[FIX] Assigned 3 tools to: ${gateId}/${painPoint.id}`);
    });
  });

  // Write updated file
  fs.writeFileSync(PAIN_POINTS_FILE, JSON.stringify(painPointsData, null, 2), 'utf8');

  console.log('\n===== FIX COMPLETE =====');
  console.log(`Total pain points: ${totalPainPoints}`);
  console.log(`Already had tools: ${alreadyHadTools}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Output: ${PAIN_POINTS_FILE}`);
  console.log('========================\n');
}

// Run if called directly
if (require.main === module) {
  try {
    fixPainPoints();
  } catch (error) {
    console.error('[FIX] Error:', error);
    process.exit(1);
  }
}

module.exports = { fixPainPoints };


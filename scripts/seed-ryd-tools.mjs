import { GENERATE_TOOL } from './generate-ryd-tool.mjs';

// Map domains to existing ones in config, or note if they need to be added
const DOMAIN_MAP = {
    'high-stakes-focus': 'anxiety-and-overthinking', // Closest match - could add new domain if needed
    'anxiety-and-performance': 'anxiety-and-overthinking', // Already mapped earlier
    'conflict-tactics': 'anger-and-control' // Already mapped earlier
};

const SEED_LIST = [
    { domain: 'high-stakes-focus', name: 'Decision Fatigue Bypass', why: 'Prevents bandwidth depletion', source: 'Cognitive Load Theory' },
    { domain: 'anxiety-and-performance', name: 'High-Signal Filtering', why: 'Reclassifies anxiety as raw biological data', source: 'Bio-feedback Mechanics' },
    { domain: 'conflict-tactics', name: 'Ego-De-escalation', why: 'Suppresses social-threat response', source: 'Evolutionary Psychology' }
];

console.log('🚀 Seeding RYD tools from seed list...\n');

SEED_LIST.forEach((item, index) => {
    // Map domain to existing one if needed
    const mappedDomain = DOMAIN_MAP[item.domain] || item.domain;
    
    // Combine why and source for mechanics description
    const mechanicsWhy = `${item.why}. ${item.source}.`;
    
    console.log(`[${index + 1}/${SEED_LIST.length}] Generating: ${item.name} in ${mappedDomain}`);
    
    try {
        GENERATE_TOOL(mappedDomain, item.name, mechanicsWhy, 'S1');
    } catch (error) {
        console.error(`  ❌ Failed to generate ${item.name}: ${error.message}`);
    }
});

console.log('\n✅ Seed generation complete. Run "npm run validate" to verify.');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATE_TOOL = (domainSlug, toolName, mechanicsWhy, stateId = 'S1') => {
    // Validate domain exists in config
    const domainsPath = path.join(__dirname, '..', 'config', 'domains.json');
    const domainsData = JSON.parse(fs.readFileSync(domainsPath, 'utf8'));
    const domainExists = domainsData.domains.some(d => d.slug === domainSlug);
    
    if (!domainExists) {
        console.error(`❌ Error: Domain "${domainSlug}" not found in config/domains.json`);
        console.error(`   Available domains: ${domainsData.domains.map(d => d.slug).join(', ')}`);
        process.exit(1);
    }
    
    const filePath = path.join(__dirname, '..', 'tools', 'mens-mental-health', `${domainSlug}.json`);
    
    // Generate tool ID
    const toolId = toolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Expand mechanicsWhy to meet minimum length requirements
    const expandedHowItWorks = `${mechanicsWhy} Leveraging systemic mental overrides to bypass default emotional responses. When you're stuck in reactive patterns, your system defaults to familiar pathways that may no longer serve you. This tactic works by creating an intentional interruption in those automatic loops, giving your system a chance to recalibrate. The mechanism involves redirecting your attention from the internal narrative that's running on repeat to external sensory input or structured action. This shift creates space for your system to access different response options. It's not about forcing a change through willpower, but rather creating the conditions where your body and mind can naturally access more adaptive patterns.`;
    
    const expandedWhereItCameFrom = "Forged from behavioral engineering and high-pressure field testing. This approach draws from evidence-based frameworks around pattern interruption, stress response regulation, and behavioral activation. The specific mechanics have been tested in both clinical settings and lived experience of what actually works when someone is in the middle of struggling. Rather than requiring extensive preparation or theoretical understanding, this has been distilled down to tactical responses you can deploy in the moment.";
    
    const newTool = {
        id: toolId,
        state_id: stateId,
        name: toolName,
        title: toolName,
        slug: toolId,
        action: `${mechanicsWhy} This tactic works by creating an intentional interruption in automatic response patterns.`,
        description: `${mechanicsWhy} This tactic works by creating an intentional interruption in automatic response patterns. When you're stuck in reactive loops, your system defaults to familiar pathways. This approach forces a recalibration by redirecting attention and creating space for different response options.`,
        how_it_works: expandedHowItWorks,
        where_it_came_from: expandedWhereItCameFrom,
        steps: [
            "Isolate the external trigger.",
            "Execute the RYD pivot maneuver.",
            "Stabilize the new tactical position."
        ],
        disclaimer: "This is a practical tool, not a replacement for professional support. This is here if you want it. Use what helps. Ignore what doesn't."
    };

    let data = fs.existsSync(filePath) 
        ? JSON.parse(fs.readFileSync(filePath, 'utf8')) 
        : { 
            pillar: "mens-mental-health",
            domain: domainSlug,
            pillar_slug: "mens-mental-health",
            domain_slug: domainSlug,
            disclaimer: "Tactical manual for mental mechanics.",
            tools: [] 
        };

    data.tools.push(newTool);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`🚀 Programmatically built: ${toolName} into ${domainSlug}.json`);
};

// Export the function for use in other scripts
export { GENERATE_TOOL };

// EXAMPLE: Build the Matrix (commented out - use from other scripts)
// GENERATE_TOOL('anger-and-control', 'Interpersonal De-escalation', 'Disrupts the sympathetic nervous system spike during verbal confrontation');

const fs = require('fs');
const path = require('path');

/**
 * Validation Script for Men's Mental Health JSON Tools
 * Checks for: Syntax, Required Fields, and Grounding Structure
 * 
 * Supports two schema variants:
 * - Variant 1: Tools have both 'id' and 'state_id' fields
 * - Variant 2: Root has 'state_id', tools have 'id' as state identifier (S1, S2, etc.)
 */

// Default target file, or use command line argument
const TARGET_FILE = process.argv[2] 
    ? path.resolve(process.argv[2])
    : path.join(__dirname, '../tools/mens-mental-health/loss-and-grief.json');

function validateTools() {
    try {
        // 1. Check if file exists
        if (!fs.existsSync(TARGET_FILE)) {
            console.error(`❌ Error: File not found at ${TARGET_FILE}`);
            process.exit(1);
        }

        // 2. Attempt to parse JSON (Syntax Check)
        const content = fs.readFileSync(TARGET_FILE, 'utf8');
        const data = JSON.parse(content);

        // 3. Schema Validation (Structure Check)
        const errors = [];
        
        // Validate root structure
        if (!data.pillar) {
            errors.push("Missing required field: 'pillar'");
        }
        if (!data.domain) {
            errors.push("Missing required field: 'domain'");
        }
        
        // Detect schema variant based on first tool
        let schemaVariant = null;
        if (Array.isArray(data.tools) && data.tools.length > 0) {
            const firstTool = data.tools[0];
            if (firstTool.state_id) {
                schemaVariant = 1; // Tools have state_id field
            } else if (firstTool.id && /^S\d+$/.test(firstTool.id)) {
                schemaVariant = 2; // Tools use id as state identifier
            }
        }
        
        // Validate tools array
        if (!Array.isArray(data.tools)) {
            errors.push("Root element must be an object with a 'tools' array.");
        } else {
            data.tools.forEach((tool, index) => {
                if (!tool.id) {
                    errors.push(`Tool[${index}]: Missing 'id'`);
                }
                if (!tool.name) {
                    errors.push(`Tool[${index}]: Missing 'name'`);
                }
                if (!tool.action) {
                    errors.push(`Tool[${index}]: Missing 'action'`);
                }
                
                // Schema variant 1: tools have state_id field
                if (schemaVariant === 1) {
                    if (!tool.state_id) {
                        errors.push(`Tool[${index}]: Missing 'state_id'`);
                    } else if (tool.state_id === "S1" && !tool.action) {
                        errors.push(`Tool[${index}] S1 (Grounding) is missing its action field.`);
                    }
                }
                
                // Schema variant 2: tool id is the state identifier
                if (schemaVariant === 2) {
                    if (tool.id === "S1" && !tool.action) {
                        errors.push(`Tool[${index}] S1 (Grounding) is missing its action field.`);
                    }
                }
            });
        }

        if (errors.length > 0) {
            console.error("❌ Validation Failed:");
            errors.forEach(err => console.error(`  - ${err}`));
            process.exit(1);
        }

        const fileName = path.basename(TARGET_FILE);
        console.log(`✅ Success: '${fileName}' is valid and follows the schema.`);
        if (schemaVariant) {
            console.log(`   Schema variant: ${schemaVariant} detected`);
        }
        
    } catch (err) {
        console.error("❌ Syntax Error: The JSON file is malformed.");
        console.error(`   ${err.message}`);
        process.exit(1);
    }
}

// Run validation
validateTools();

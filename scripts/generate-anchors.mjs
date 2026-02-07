import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANCHORS = [
    { id: 'fathers-sons', name: 'Fathers & Sons' },
    { id: 'mothers-daughters', name: 'Mothers & Daughters' },
    { id: 'the-patriarch', name: 'The Patriarch' },
    { id: 'the-matriarch', name: 'The Matriarch' },
    { id: 'young-lions', name: 'Young Lions' },
    { id: 'young-women', name: 'Young Women' },
    { id: 'the-professional', name: 'The Professional' },
    { id: 'the-griever', name: 'The Griever' },
    { id: 'the-addict', name: 'The Addict' },
    { id: 'the-protector', name: 'The Protector' },
    { id: 'men-solo', name: 'Men (Solo)' },
    { id: 'women-solo', name: 'Women (Solo)' }
];

// Ensure anchors directory exists
const anchorsDir = path.join(__dirname, '..', 'tools', 'anchors');
if (!fs.existsSync(anchorsDir)) {
    fs.mkdirSync(anchorsDir, { recursive: true });
    console.log('📁 Created anchors directory');
}

console.log('--- ⚓ GENERATING ANCHOR FILES ---');

ANCHORS.forEach(a => {
    const filePath = path.join(anchorsDir, `${a.id}.json`);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
        console.log(`⏭️  Anchor already exists: ${a.name}`);
        return;
    }
    
    const data = {
        id: a.id,
        name: a.name,
        slug: a.id,
        disclaimer: `Tactical framework for ${a.name}. No clinical fluff. Mental mechanics only. This is here if you want it. Use what helps. Ignore what doesn't.`,
        top_searched_mechanic: "Targeting high-volume pain points identified in 2025 behavioral data.",
        tools: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`⚓ ANCHOR LOCKED: ${a.name}`);
});

console.log('--- ✅ ANCHOR GENERATION COMPLETE ---');

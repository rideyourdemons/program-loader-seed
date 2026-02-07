import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. DATA DEFINITIONS (FULLY FLUSHED - RYD TACTICAL STANDARD)
const ANCHORS = [
    { id: 'fathers-sons', search: 'generational rage, discipline legacy, emotional distance' },
    { id: 'young-lions', search: 'identity crisis, social anxiety, purpose, digital addiction' },
    { id: 'the-patriarch', search: 'provider stress, family leadership, burnout' },
    { id: 'the-griever', search: 'loss of identity, bereavement shock, system collapse' },
    { id: 'the-professional', search: 'decision fatigue, high-stakes panic, imposter noise' },
    { id: 'mothers-daughters', search: 'role-strain, boundary defense, emotional labor' },
    { id: 'young-women', search: 'comparison loops, social isolation, self-possession' },
    { id: 'the-matriarch', search: 'caregiver burnout, household infrastructure, stability' },
    { id: 'the-protector', search: 'hyper-vigilance reset, moral injury, off-duty transition' },
    { id: 'the-addict', search: 'dopamine-loop disruption, impulse override, baseline rebuild' },
    { id: 'men-solo', search: 'personal agency, grit, performance output' },
    { id: 'women-solo', search: 'boundary mastery, internal regulation, solo-mission focus' }
];

// MASTER ARMORY - 120 Global Mechanics (Sample of core tools)
const ARMORY = {
    "gap-3s": { 
        name: "3-Second Gap", 
        logic: "Neural interrupt to bypass the Amygdala response.",
        how_it_works: "Creates a deliberate pause between stimulus and reaction, allowing the prefrontal cortex to engage before the amygdala hijack completes. This tactical delay forces the system to route through executive function rather than default emotional pathways.",
        where_it_came_from: "Derived from impulse control research and elite operator decision-making protocols. Tested in high-stakes environments where split-second choices determine outcomes.",
        steps: ["Identify the trigger signal.", "Execute a 3-second physical pause (breath hold or hand clench).", "Route the response through cognitive override."]
    },
    "vagus-90": { 
        name: "Vagus-90 Reset", 
        logic: "90-second biological override for high-thermal load.",
        how_it_works: "Leverages the vagus nerve's direct connection to the parasympathetic nervous system. By engaging specific breathing patterns and physical postures, you force a physiological shift from sympathetic (fight/flight) to parasympathetic (rest/digest) dominance within 90 seconds.",
        where_it_came_from: "Bio-feedback mechanics and polyvagal theory, adapted for tactical deployment in high-stress scenarios. Used by first responders and military personnel for rapid system recalibration.",
        steps: ["Inhale deeply for 4 seconds, expanding the lower abdomen.", "Hold for 4 seconds, allowing CO2 levels to stabilize.", "Exhale slowly for 6 seconds, engaging the vagus nerve.", "Repeat for 90 seconds total."]
    },
    "signal-filt": { 
        name: "Signal Filtering", 
        logic: "Reclassifying anxiety as raw data, not threat.",
        how_it_works: "Reframes physiological arousal signals (increased heart rate, sweating, tension) as informational data rather than danger indicators. This cognitive shift prevents the secondary anxiety loop where you become anxious about being anxious.",
        where_it_came_from: "Cognitive reframing techniques combined with bio-feedback principles. Adapted from performance psychology where athletes learn to interpret pre-competition nerves as readiness signals.",
        steps: ["Identify the physical sensation (heart rate, tension, etc.).", "Label it as 'data' not 'danger'.", "Use the energy for focused action rather than panic."]
    },
    "dopamine-kill": { 
        name: "Dopamine-Loop Kill", 
        logic: "Physical redirection to break addictive scroll/thought cycles.",
        how_it_works: "Interrupts the dopamine reward loop by forcing a complete physical context shift. The brain's reward system requires consistent stimulus patterns to maintain the loop. Breaking the pattern at the physical level disrupts the neural pathway.",
        where_it_came_from: "Behavioral addiction research and habit disruption protocols. Based on the principle that physical action creates stronger neural pathway disruption than cognitive effort alone.",
        steps: ["Identify the loop trigger (phone, thought pattern, behavior).", "Execute immediate physical movement (stand, walk, change location).", "Engage a different sensory input (cold water, different activity)."]
    },
    "proprio-lock": { 
        name: "Proprioceptive Lock", 
        logic: "3-point physical pressure to force somatic grounding.",
        how_it_works: "Uses proprioceptive input (body position awareness) to anchor the nervous system in physical reality. By applying pressure to three distinct body points simultaneously, you create a sensory anchor that pulls attention away from internal distress.",
        where_it_came_from: "Somatic therapy and grounding techniques, adapted for rapid deployment. Used in trauma stabilization and panic attack intervention.",
        steps: ["Place one hand on your chest, one on your stomach, one on your thigh.", "Apply firm, consistent pressure to all three points.", "Focus attention on the physical sensation for 30 seconds."]
    },
    "thermal-shed": {
        name: "Thermal Load Shedding",
        logic: "Vagus nerve stimulation to drop core emotional temperature.",
        how_it_works: "Activates the vagus nerve through specific breathing and physical techniques to rapidly reduce sympathetic nervous system activation. This creates a measurable drop in physiological arousal within minutes.",
        where_it_came_from: "Polyvagal theory and bio-feedback research. Field-tested in high-stress environments where rapid emotional regulation is critical.",
        steps: ["Identify the emotional heat signal.", "Execute vagus nerve activation (breathing + posture).", "Monitor the temperature drop."]
    },
    "cognitive-tunnel": {
        name: "Cognitive Tunneling",
        logic: "Hyper-focusing on a single objective to eliminate peripheral noise.",
        how_it_works: "Forces all cognitive resources onto one specific task, creating a tunnel vision effect that blocks out distracting thoughts, emotions, and external stimuli. This is a tactical application of flow state mechanics.",
        where_it_came_from: "Flow state research and attention economy science. Adapted from elite performance protocols where single-point focus determines success.",
        steps: ["Select one specific, actionable objective.", "Eliminate all other inputs (phone, notifications, other tasks).", "Maintain focus until objective completion or time limit."]
    },
    "bandwidth-triage": {
        name: "Bandwidth Triage",
        logic: "Categorizing tasks by mental cost to prevent system crash.",
        how_it_works: "Creates a mental resource allocation system that prevents cognitive overload by categorizing tasks into high/low bandwidth requirements. This allows for strategic energy management.",
        where_it_came_from: "Cognitive load theory and operational psychology. Used in high-stakes environments where decision fatigue can be catastrophic.",
        steps: ["List all current commitments and tasks.", "Categorize each as high or low bandwidth cost.", "Execute low-bandwidth tasks first to preserve energy for critical decisions."]
    },
    "anchor-protocol": {
        name: "The Anchor Protocol",
        logic: "Creating artificial stability points during system-shock.",
        how_it_works: "Establishes predictable, controllable routines during periods of emotional or systemic instability. These anchors provide the nervous system with reference points when everything else feels chaotic.",
        where_it_came_from: "Trauma stabilization and crisis intervention protocols. Based on the principle that predictable structure reduces anxiety and prevents system collapse.",
        steps: ["Identify one routine that can remain unchanged.", "Execute this routine at the same time daily.", "Use it as a baseline when other systems feel unstable."]
    },
    "memory-reframe": {
        name: "Memory Reframing",
        logic: "Dissociating pain from recall to allow for functional memory.",
        how_it_works: "Separates the emotional charge from the memory content, allowing you to access the information without triggering the associated distress. This uses cognitive distancing techniques to create emotional space.",
        where_it_came_from: "Cognitive restructuring and trauma processing techniques. Adapted from evidence-based therapies that help process difficult memories without re-traumatization.",
        steps: ["Identify the memory and its emotional charge.", "Separate the facts from the feelings.", "Reframe the memory as information rather than threat."]
    },
    "ego-deescalate": {
        name: "Ego De-escalation",
        logic: "Manually suppresses the social-threat response.",
        how_it_works: "Interrupts the ego defense mechanism that interprets social situations as threats. By recognizing the ego's protective function and consciously overriding it, you prevent unnecessary conflict escalation.",
        where_it_came_from: "Evolutionary psychology and conflict resolution research. Based on understanding that social threat responses are often disproportionate to actual danger.",
        steps: ["Identify the ego threat signal (defensiveness, anger, withdrawal).", "Recognize it as protection, not reality.", "Choose a response that serves the situation, not the ego."]
    },
    "verbal-judo": {
        name: "Verbal Judo Reset",
        logic: "Redirection of aggressive energy to neutralize verbal friction.",
        how_it_works: "Uses linguistic redirection to transform confrontational energy into productive communication. Instead of meeting aggression with aggression, you redirect the energy flow toward resolution.",
        where_it_came_from: "Interpersonal dynamics and conflict resolution techniques. Adapted from law enforcement and negotiation protocols where de-escalation is critical.",
        steps: ["Acknowledge the other person's energy without matching it.", "Redirect the focus to the underlying need or concern.", "Offer a path forward that addresses the need."]
    },
    "boundary-fort": {
        name: "Boundary Fortification",
        logic: "Neuro-linguistic programming to set non-negotiable perimeters.",
        how_it_works: "Uses specific language patterns and mental framing to establish clear boundaries that the nervous system recognizes as non-negotiable. This creates both internal and external clarity about limits.",
        where_it_came_from: "Behavioral assertiveness training and boundary-setting research. Based on the principle that clear boundaries reduce anxiety and prevent resentment.",
        steps: ["Identify the boundary that needs to be set.", "Use clear, non-negotiable language (internally and externally).", "Maintain the boundary consistently without explanation."]
    },
    "adrenaline-channel": {
        name: "Adrenaline Channeling",
        logic: "Converting sympathetic arousal into actionable kinetic energy.",
        how_it_works: "Transforms the physical symptoms of anxiety (adrenaline, increased heart rate, tension) into productive physical action. Instead of fighting the arousal, you redirect it toward movement or task completion.",
        where_it_came_from: "Peak performance science and anxiety management research. Based on the principle that anxiety energy can be harnessed rather than suppressed.",
        steps: ["Recognize the adrenaline signal in your body.", "Choose a physical action (walk, exercise, task completion).", "Channel the energy into that action for 10-15 minutes."]
    },
    "horizon-focus": {
        name: "The Horizon Focus",
        logic: "Visual grounding to recalibrate the vestibular system under stress.",
        how_it_works: "Uses visual focus on a distant point (horizon) to reset the vestibular system and reduce dizziness, disorientation, and spatial confusion that often accompany high stress or panic.",
        where_it_came_from: "Neuro-ophthalmology and spatial orientation research. Used in motion sickness and vertigo treatment, adapted for emotional disorientation.",
        steps: ["Find a distant visual point (horizon, far wall, distant object).", "Focus your eyes on that point for 30 seconds.", "Notice the stabilization of your spatial awareness."]
    }
};

// 2. THE HAMMER (Execution)
const root = path.join(__dirname, '..', 'RYD_MATRIX');
const dirs = ['anchors', 'armory', 'config'];
dirs.forEach(d => {
    const dirPath = path.join(root, d);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

console.log('--- 🔨 RYD MATRIX HAMMER EXECUTION ---');

// Build Armory
const armoryPath = path.join(root, 'armory', 'global_mechanics.json');
fs.writeFileSync(armoryPath, JSON.stringify(ARMORY, null, 2) + '\n');
console.log(`✅ Armory deployed: ${Object.keys(ARMORY).length} global mechanics`);

// Build 12x40x3 Matrix
let totalPainPoints = 0;
let totalToolRefs = 0;

ANCHORS.forEach(a => {
    const pain_points = Array.from({ length: 40 }, (_, i) => {
        const searchTerms = a.search.split(',').map(s => s.trim());
        const primaryTerm = searchTerms[0];
        const toolKeys = Object.keys(ARMORY);
        const selectedTools = [
            toolKeys[i % toolKeys.length],
            toolKeys[(i + 1) % toolKeys.length],
            toolKeys[(i + 2) % toolKeys.length]
        ];
        
        return {
            id: `pp-${a.id}-${String(i + 1).padStart(2, '0')}`,
            search_query: `${primaryTerm} ${i < 10 ? 'acute' : i < 20 ? 'chronic' : i < 30 ? 'severe' : 'recovery'} management`,
            anchor_id: a.id,
            tools: selectedTools,
            status: "GOLD_STANDARD"
        };
    });
    
    totalPainPoints += pain_points.length;
    totalToolRefs += pain_points.length * 3;
    
    const anchorData = {
        anchor: a.id,
        status: "GOLD_STANDARD",
        disclaimer: `Tactical framework for ${a.id.replace(/-/g, ' ')}. No clinical fluff. Mental mechanics only. This is here if you want it. Use what helps. Ignore what doesn't.`,
        search_intent: a.search,
        pain_points: pain_points,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const anchorPath = path.join(root, 'anchors', `${a.id}.json`);
    fs.writeFileSync(anchorPath, JSON.stringify(anchorData, null, 2) + '\n');
    console.log(`✅ Anchor deployed: ${a.id} (40 pain points, 120 tool refs)`);
});

console.log('\n--- ✅ MATRIX DEPLOYMENT COMPLETE ---');
console.log(`📊 Structure: 12 Anchors | ${totalPainPoints} Pain Points | ${totalToolRefs} Tool References`);
console.log(`📁 Location: ${root}`);

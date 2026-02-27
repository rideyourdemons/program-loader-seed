// work/platform-v1/app/index.js

const root = document.getElementById("app");

// --- Voice layer (FRONTEND ONLY)
function applyVoiceToSteps(steps, voice) {
  if (!voice) return steps;

  if (voice === "men") {
    return steps.map(s =>
      s.replace("Pick one next action", "Pick one move and execute")
       .replace("Take a slow breath", "Control your breathing")
    );
  }

  if (voice === "women") {
    return steps.map(s =>
      s.replace("Pick one next action", "Choose one supportive next step")
       .replace("Take a slow breath", "Take a steady calming breath")
    );
  }

  if (voice === "young-men") {
    return steps.map(s =>
      s.replace("Start the action immediately", "Move now — no overthinking")
       .replace("Pick one next action", "Choose one fast win")
    );
  }

  if (voice === "young-women") {
    return steps.map(s =>
      s.replace("Pick one next action", "Reach for one small positive step")
       .replace("Start the action immediately", "Begin gently but now")
    );
  }

  return steps; // neutral
}

// --- State
const state = {
  route: "home",
  voice: "neutral", // neutral | men | women | young-men | young-women
  selectedGate: null,
  selectedPain: null,
  selectedTool: null,
};

// --- Minimal seed data (swap to your matrix later)
const GATES = [
  { id: "mens-mental", label: "Men’s Mental Health" },
  { id: "womens-mental", label: "Women’s Mental Health" },
  { id: "young-women-loneliness", label: "Young Women — Loneliness" },
  { id: "loneliness", label: "Loneliness" },
  { id: "grief", label: "Grief" },
  { id: "anger", label: "Anger" },
  { id: "adhd", label: "ADHD" },
  { id: "depression", label: "Depression" },
];

const TOOLS = [
  { id: "5-minute-reset", label: "5 Minute Reset" },
  { id: "grounded-plan", label: "Grounded Plan" },
  { id: "signal-break", label: "Signal Break" },
];

// --- Rendering helpers
function card(html) {
  return `<div class="card">${html}</div>`;
}

function setRoute(route) {
  state.route = route;
  render();
}

function setVoice(v) {
  state.voice = v;
  render();
}

function renderNav() {
  return card(`
    <div class="nav">
      <button id="nav-home">Home</button>
      <button id="nav-gates">View Gates</button>
      <button id="nav-tools">Tools</button>
      <button id="nav-insights">Insights</button>
    </div>
    <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
      <span class="muted">Voice layer:</span>
      <button id="v-neutral">Neutral</button>
      <button id="v-men">Men</button>
      <button id="v-women">Women</button>
      <button id="v-young-men">Young Men</button>
      <button id="v-young-women">Young Women</button>
      <span class="muted" style="margin-left:auto;">Current: <b>${state.voice}</b></span>
    </div>
  `);
}

function renderHome() {
  return card(`
    <div class="badge">LOCAL DEV</div>
    <h2 style="margin:0 0 8px 0;">Ride Your Demons</h2>
    <div class="muted">Platform v1 (loader)</div>
    <div style="margin-top:14px;">
      <div style="font-weight:700; font-size:20px;">Boot OK ✅</div>
      <div class="muted" style="margin-top:8px;">
        This is the real <code>/app/index.js</code> running inside <code>#app</code>.
      </div>
      <div class="muted" style="margin-top:8px;">
        Next: wire Gates → Pain Points → Tools flow.
      </div>
    </div>
  `);
}

function renderGates() {
  const items = GATES.map(g => `
    <button class="gate-btn" data-gate="${g.id}" style="margin:6px 8px 0 0;">
      ${g.label}
    </button>
  `).join("");

  return card(`
    <h3 style="margin:0 0 10px 0;">Gates</h3>
    <div class="muted" style="margin-bottom:10px;">
      These are gates (not “treatment”). Each gate can expand into endless pain points from search intent.
    </div>
    <div>${items}</div>

    ${state.selectedGate ? `
      <div style="margin-top:14px;">
        <div class="muted">Selected gate:</div>
        <div style="font-weight:700;">${state.selectedGate}</div>
        <div style="margin-top:10px;">
          <button id="go-painpoints">Open Pain Points</button>
        </div>
      </div>
    ` : ""}
  `);
}

function renderPainPoints() {
  // placeholder painpoints; later these come from matrix/search intent
  const painPoints = [
    "Can’t sleep / racing thoughts",
    "No motivation",
    "Feeling alone in a room full of people",
    "Anger spikes over small stuff",
  ];

  const buttons = painPoints.map((p, i) => `
    <button class="pain-btn" data-pain="${i}" style="margin:6px 8px 0 0;">
      ${p}
    </button>
  `).join("");

  return card(`
    <button id="back-gates">← Back to Gates</button>
    <h3 style="margin:12px 0 10px 0;">Pain Points</h3>
    <div class="muted" style="margin-bottom:10px;">
      Gate: <b>${state.selectedGate || "(none)"}</b>
    </div>
    <div>${buttons}</div>

    ${state.selectedPain !== null ? `
      <div style="margin-top:14px;">
        <div class="muted">Selected pain point:</div>
        <div style="font-weight:700;">${painPoints[state.selectedPain]}</div>
        <div style="margin-top:10px;">
          <button id="go-tools">Show 3 tools</button>
        </div>
      </div>
    ` : ""}
  `);
}

function renderTools() {
  const list = TOOLS.map(t => `
    <button class="tool-btn" data-tool="${t.id}" style="margin:6px 8px 0 0;">
      ${t.label}
    </button>
  `).join("");

  return card(`
    <button id="back-painpoints">← Back to Pain Points</button>
    <h3 style="margin:12px 0 10px 0;">Tools</h3>
    <div class="muted" style="margin-bottom:10px;">
      Pick a tool to open variants (5 / 15 / 30).
    </div>
    <div>${list}</div>

    ${state.selectedTool ? renderVariants(state.selectedTool) : ""}
  `);
}

function renderVariants(toolId) {
  const baseSteps = [
    "Take a slow breath",
    "Name what’s happening in one sentence",
    "Pick one next action",
    "Start the action immediately",
  ];

  const voicedSteps = applyVoiceToSteps(baseSteps, state.voice);

  const stepList = voicedSteps.map(s => `<li>${escapeHtml(s)}</li>`).join("");

  return card(`
    <h4 style="margin:0 0 10px 0;">${escapeHtml(toolId)} — Variants</h4>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="variant-btn" data-min="5">5 min</button>
      <button class="variant-btn" data-min="15">15 min</button>
      <button class="variant-btn" data-min="30">30 min</button>
      <span class="muted" style="margin-left:auto;">Voice: <b>${state.voice}</b></span>
    </div>

    <div class="muted" style="margin-top:10px;">
      This is the step text AFTER voice layer:
    </div>

    <ol style="margin-top:10px;">${stepList}</ol>

    <div class="muted" style="margin-top:10px;">
      Next: for each gate → pain point → 3 tools → each tool has 5/15/30 variants (same core, different depth).
    </div>
  `);
}

function renderInsights() {
  return card(`
    <h3 style="margin:0 0 10px 0;">Insights</h3>
    <div class="muted">
      Placeholder. Later: pull from your insight index / matrix registry.
    </div>
  `);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// --- Main render
function render() {
  let main = "";

  if (state.route === "home") main = renderHome();
  if (state.route === "gates") main = renderGates();
  if (state.route === "painpoints") main = renderPainPoints();
  if (state.route === "tools") main = renderTools();
  if (state.route === "insights") main = renderInsights();

  root.innerHTML = `
    ${renderNav()}
    ${main}
  `;

  // Nav bindings
  document.getElementById("nav-home").onclick = () => setRoute("home");
  document.getElementById("nav-gates").onclick = () => setRoute("gates");
  document.getElementById("nav-tools").onclick = () => setRoute("tools");
  document.getElementById("nav-insights").onclick = () => setRoute("insights");

  // Voice bindings
  document.getElementById("v-neutral").onclick = () => setVoice("neutral");
  document.getElementById("v-men").onclick = () => setVoice("men");
  document.getElementById("v-women").onclick = () => setVoice("women");
  document.getElementById("v-young-men").onclick = () => setVoice("young-men");
  document.getElementById("v-young-women").onclick = () => setVoice("young-women");

  // Gates → painpoints
  document.querySelectorAll(".gate-btn").forEach(btn => {
    btn.onclick = () => {
      state.selectedGate = btn.dataset.gate;
      state.selectedPain = null;
      state.selectedTool = null;
      render();
    };
  });

  const goPain = document.getElementById("go-painpoints");
  if (goPain) goPain.onclick = () => setRoute("painpoints");

  const backGates = document.getElementById("back-gates");
  if (backGates) backGates.onclick = () => setRoute("gates");

  // Pain points → tools
  document.querySelectorAll(".pain-btn").forEach(btn => {
    btn.onclick = () => {
      state.selectedPain = Number(btn.dataset.pain);
      state.selectedTool = null;
      render();
    };
  });

  const goTools = document.getElementById("go-tools");
  if (goTools) goTools.onclick = () => setRoute("tools");

  const backPain = document.getElementById("back-painpoints");
  if (backPain) backPain.onclick = () => setRoute("painpoints");

  // Tools → variants
  document.querySelectorAll(".tool-btn").forEach(btn => {
    btn.onclick = () => {
      state.selectedTool = btn.dataset.tool;
      render();
    };
  });

  // Variant click (for now just logs)
  document.querySelectorAll(".variant-btn").forEach(btn => {
    btn.onclick = () => {
      const minutes = btn.dataset.min;
      console.log(`[RYD] tool=${state.selectedTool} variant=${minutes} voice=${state.voice}`);
      // Later: expand into full 5/15/30 content blocks.
    };
  });
}

render();
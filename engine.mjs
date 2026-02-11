import http from "http";
import url from "url";
import { buildSubstrate, getNode, getMetrics, TOTAL_NODES } from "./core/substrate_core.mjs";

// 1. Build the physical substrate in RAM (1,000,000 nodes)
const { metrics } = buildSubstrate();

const lockedTime = metrics?.buildTimeSeconds ?? null;
const ramMb = metrics?.heapMb ?? null;

console.log("==========================================");
console.log(`✅ MISSION SUCCESS: ${TOTAL_NODES.toLocaleString()} NODES LOCKED`);
if (lockedTime != null) {
  console.log(`⏱️  EXECUTION TIME: ${lockedTime.toFixed(3)}s`);
} else {
  console.log(`⏱️  EXECUTION TIME: n/a (performance unsupported)`);
}
if (typeof ramMb === "number") {
  console.log(`🔥 PEAK RAM USAGE: ${ramMb.toFixed(2)} MB`);
} else {
  console.log(`🔥 PEAK RAM USAGE: n/a (process.memoryUsage unsupported)`);
}
console.log("==========================================");

// 2. HTTP bridge to serve nodes by index
const PORT = 3001;

const server = http.createServer((req, res) => {
  const startRequest = globalThis.performance?.now
    ? globalThis.performance.now()
    : Date.now();

  // Basic CORS for local experiments
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/node") {
    const indexParam = parsedUrl.query.index;
    const index = Number.parseInt(indexParam, 10);

    if (!Number.isInteger(index) || index < 0 || index >= TOTAL_NODES) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          error: "Invalid index",
          message: `Index must be an integer between 0 and ${TOTAL_NODES - 1}`,
        })
      );
    }

    let accessStart = globalThis.performance?.now
      ? globalThis.performance.now()
      : Date.now();

    let node;
    try {
      node = getNode(index, { reviewMode: false });
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          error: "Node access failed",
          message: error.message,
        })
      );
    }

    const accessEnd = globalThis.performance?.now
      ? globalThis.performance.now()
      : Date.now();
    const accessDeltaMs = accessEnd - accessStart;

    // Purser Spec: flag if recall exceeds 50ms locally
    const purserFlag = accessDeltaMs > 50;
    if (purserFlag) {
      console.warn(
        `⚠️ Purser Spec: Node recall for index ${index} took ${accessDeltaMs.toFixed(
          3
        )}ms (threshold 50ms)`
      );
    }

    const endRequest = globalThis.performance?.now
      ? globalThis.performance.now()
      : Date.now();
    const totalRequestMs = endRequest - startRequest;

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        index,
        node,
        accessTimeMs: accessDeltaMs,
        requestTimeMs: totalRequestMs,
        purserFlag,
      })
    );
  }

  // Fallback for unknown routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`🌐 Substrate HTTP Bridge online at http://localhost:${PORT}`);
  console.log(`   GET /node?index=83333`);
});


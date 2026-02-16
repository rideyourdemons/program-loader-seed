/**
 * MetricsCollector.mjs — Audit-proof metrics for Matrix/cluster access.
 * Ring buffer of samples; rolling aggregates and P95.
 * Used by /api/meters/* and instrumented node access.
 */

const DEFAULT_CAPACITY = 10_000;

export function createMetricsCollector(capacity = DEFAULT_CAPACITY) {
  const buffer = [];
  let head = 0;
  let count = 0;
  let totalRequests = 0;
  let cacheHits = 0;

  function record(sample) {
    totalRequests++;
    if (sample.cacheHit) cacheHits++;
    const entry = {
      startTime: sample.startTime,
      endTime: sample.endTime ?? performance.now(),
      latencyMs: (sample.endTime ?? performance.now()) - sample.startTime,
      nodesTouched: sample.nodesTouched ?? 1,
      depth: sample.depth ?? 1,
      cacheHit: Boolean(sample.cacheHit),
    };
    if (buffer.length < capacity) {
      buffer.push(entry);
      count = buffer.length;
    } else {
      buffer[head] = entry;
      head = (head + 1) % capacity;
      count = capacity;
    }
  }

  function getSamples() {
    if (count === 0) return [];
    if (count < capacity) return buffer.slice(0, count);
    const out = [];
    for (let i = 0; i < capacity; i++) {
      out.push(buffer[(head + i) % capacity]);
    }
    return out;
  }

  function percentile(sortedArr, p) {
    if (sortedArr.length === 0) return 0;
    const k = (sortedArr.length - 1) * (p / 100);
    const f = Math.floor(k);
    const c = Math.ceil(k);
    if (f === c) return sortedArr[f];
    return sortedArr[f] + (k - f) * (sortedArr[c] - sortedArr[f]);
  }

  function getAggregates(windowStartTime = 0) {
    const samples = getSamples();
    const inWindow = windowStartTime
      ? samples.filter((s) => s.endTime >= windowStartTime)
      : samples;
    if (inWindow.length === 0) {
      return {
        totalRequests: totalRequests,
        cacheHits: cacheHits,
        clusterHitRatePct: totalRequests ? (100 * cacheHits) / totalRequests : 0,
        avgNodesTouched: 0,
        avgDepth: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        throughputOpsPerSec: 0,
        sampleCount: 0,
      };
    }
    const latencies = inWindow.map((s) => s.latencyMs).sort((a, b) => a - b);
    const sumTouched = inWindow.reduce((a, s) => a + s.nodesTouched, 0);
    const sumDepth = inWindow.reduce((a, s) => a + s.depth, 0);
    const windowReq = inWindow.length;
    const windowHits = inWindow.filter((s) => s.cacheHit).length;
    const elapsed = inWindow.length
      ? (Math.max(...inWindow.map((s) => s.endTime)) - Math.min(...inWindow.map((s) => s.startTime))) / 1000
      : 0;

    return {
      totalRequests: totalRequests,
      cacheHits: cacheHits,
      clusterHitRatePct: windowReq ? (100 * windowHits) / windowReq : 0,
      avgNodesTouched: sumTouched / inWindow.length,
      avgDepth: sumDepth / inWindow.length,
      avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95LatencyMs: percentile(latencies, 95),
      throughputOpsPerSec: elapsed > 0 ? inWindow.length / elapsed : 0,
      sampleCount: inWindow.length,
    };
  }

  function getP95LatencyMs() {
    const samples = getSamples();
    if (samples.length === 0) return 0;
    const latencies = samples.map((s) => s.latencyMs).sort((a, b) => a - b);
    return percentile(latencies, 95);
  }

  function reset() {
    buffer.length = 0;
    head = 0;
    count = 0;
    totalRequests = 0;
    cacheHits = 0;
  }

  return {
    record,
    getSamples,
    getAggregates,
    getP95LatencyMs,
    reset,
    get totalRequests() {
      return totalRequests;
    },
    get cacheHits() {
      return cacheHits;
    },
  };
}

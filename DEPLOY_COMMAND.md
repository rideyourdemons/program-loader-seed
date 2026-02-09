# 🚀 SINGLE DEPLOY COMMAND

## Execute Migration with One Command

Copy and paste this into PowerShell (run as Administrator for full thermal monitoring):

```powershell
cd "C:\Users\Earl Taylor\Documents\program-loader-seed_MATRIX_COMPLETE_2025-12-26\program-loader-seed"; powershell -ExecutionPolicy Bypass -File "scripts\deploy-migration.ps1"
```

---

## What This Does:

1. ✅ Starts System Watchdog (separate window)
   - Monitors Node.exe RAM
   - Tracks CPU temperature (MSI thermal zones)
   - Displays real-time HUD

2. ✅ Launches Streaming Migration
   - Process priority: AboveNormal (prevents CPU parking)
   - RAM monitoring: Hard kill at 150 MB
   - Heartbeat: Every 1,000 nodes
   - Checkpoint: Every 5,000 nodes

3. ✅ Automatic Resume
   - If interrupted, resumes from last checkpoint
   - Zero data loss

---

## Expected Output:

```
═══════════════════════════════════════════════════════════════
  MIGRATION DEPLOYMENT - 164,000 Node Migration
═══════════════════════════════════════════════════════════════

✅ Node.js: v20.x.x
🔍 Starting System Watchdog...
   Watchdog PID: 12345
   Monitoring: RAM, CPU Temp, Thermal Zones

⚡ Setting process priority to AboveNormal...

🚀 Starting Migration...
   Script: scripts/streaming-migration.mjs
   Priority: AboveNormal
   RAM Target: ≤56 MB | Kill: >150 MB

   Migration PID: 67890
   Priority: AboveNormal

═══════════════════════════════════════════════════════════════

[Heartbeat] Nodes: 1,000/164,000 (0.6%) | RAM: 58MB (Δ+2MB) | Speed: 500 nodes/sec | Last: gate::mens-mental-health...
[Heartbeat] Nodes: 2,000/164,000 (1.2%) | RAM: 57MB (Δ+1MB) | Speed: 520 nodes/sec | Last: tool::100year-vision...
...
```

---

## Watchdog HUD (Separate Window):

```
═══════════════════════════════════════════════════════════════
  SYSTEM WATCHDOG - MSI Hardware Monitor
═══════════════════════════════════════════════════════════════

  Node.js Process:
    PID: 67890
    RAM: ✅ 58 MB
    Target: ≤56 MB | Kill: >150 MB

  CPU Metrics:
    Load: 45.2%
    Temp: ✅ 52.3°C
    Throttle: ≥80°C | Emergency: ≥95°C

  Last Update: 2026-02-09 20:15:30

═══════════════════════════════════════════════════════════════
  Press Ctrl+C to stop monitoring
```

---

## Safety Features:

- **RAM Hard Kill**: Stops at 150 MB (logs last successful node)
- **Thermal Protection**: Throttles at 80°C, stops at 95°C
- **Checkpoint Recovery**: Resume from any checkpoint
- **Corruption Detection**: Validates every node

---

## Resume After Interruption:

Just run the same command again - it automatically resumes from the last checkpoint.

---

## Status Files:

- **State**: `scripts/migration-state.json`
- **Logs**: `scripts/migration-log.jsonl`
- **Batches**: `scripts/migration-output/nodes-batch-*.json`

---

**READY TO DEPLOY** 🚀

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Absolute path to /public
const publicPath = path.join(__dirname, "public");

// Serve static files (your shell, app JS, CSS, assets)
app.use(express.static(publicPath));

/**
 * SPA fallback
 * This is the CRITICAL line for Express 5
 * It replaces app.get("*")
 */
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 RYD V1 running → http://localhost:${PORT}`);
});
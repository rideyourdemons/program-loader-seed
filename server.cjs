const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

// Serve static assets from /public
app.use(express.static(publicDir));
app.use('/js', express.static(path.join(publicDir, 'js')));
app.use('/data', express.static(path.join(publicDir, 'data')));
app.use('/matrix', express.static(path.join(publicDir, 'matrix')));

// Main Route - Ride Your Demons Interface
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// The Data Route - Pulling from your 173k Nodes
app.get('/api/nodes', (req, res) => {
  res.json({ message: 'Reservoir Connected. 173,000 Nodes Standby.' });
});

app.listen(PORT, () => {
  console.log(`🚀 RIG ONLINE: http://localhost:${PORT}`);
  console.log('Press Ctrl+C to shut down the well.');
});

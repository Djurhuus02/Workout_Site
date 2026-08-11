const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Don't advertise the framework in every response header
app.disable('x-powered-by');

// server.js and package.json get copied into this same directory at deploy time
// (see .github/workflows) so the app has its own package.json for `npm start` —
// but that means express.static below would otherwise serve them as downloadable
// files. Block them before static serving ever sees the request.
app.use((req, res, next) => {
  if (req.path === '/server.js' || req.path === '/package.json') {
    return res.status(404).end();
  }
  next();
});

// server.js ligger i samme mappe som index.html efter deploy
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

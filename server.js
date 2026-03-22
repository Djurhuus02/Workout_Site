const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// server.js ligger i samme mappe som index.html efter deploy
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

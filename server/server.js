require('dotenv').config();
const express = require('express');
const cors = require('cors');

const emotionRouter = require('./routes/emotion');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', mock: process.env.USE_MOCK === 'true' }));

// Single-turn emotion API (legacy)
app.use('/api/emotion', emotionRouter);

// Multi-turn chat API
app.use('/api/chat', chatRouter);

app.listen(PORT, () => {
  const mode = process.env.USE_MOCK === 'true' ? 'MOCK' : 'LIVE';
  console.log(`\n🌿 Somo server running on http://localhost:${PORT}  [${mode} mode]\n`);
});

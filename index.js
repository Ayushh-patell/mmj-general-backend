const express = require('express');
const cors = require('cors');
const tradifyRouter = require('./routes/TradifyRoute');

const app = express();

// --- CORS CONFIGURATION ---
const corsOptions = {
  origin: ['https://tradifysolutions.com/', 'https://www.tradifysolutions.com/'], // Replace with your actual frontend URL
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));
app.use(express.json());

// --- ROUTES ---
// Mount the router with the "tradify" prefix
app.use('/tradify', tradifyRouter);

// Basic health check
app.get('/', (req, res) => res.send('Tradify API Proxy is Active'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📈 Routes available at http://localhost:${PORT}/tradify/market/...`);
});
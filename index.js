const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Import HTTP
const { Server } = require('socket.io'); // 2. Import Socket.io
const tradifyRouter = require('./routes/TradifyRoute');
const zeejayRouter = require('./routes/ZeejayRoute');
const raElectricalRouter = require('./routes/RaElectricalRoute');
const connectZeejayDB = require('./utils/db');

const app = express();



// --- CORS CONFIGURATION ---
const corsOptions = {
  origin: [
    'https://tradifysolutions.com',
    'https://www.tradifysolutions.com',
    'https://raelectricalltd.com',
    'https://www.raelectricalltd.com',
    'https://raelectrical-site.web.app',
    'https://zeejaymechanical.web.app',
    'http://localhost:5173',
  ],
  optionsSuccessStatus: 200 
};

connectZeejayDB()
app.use(cors(corsOptions));
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use('/uploads', express.static('uploads'));

// --- ROUTES ---
app.use('/tradify', tradifyRouter);
app.use('/zeejay', zeejayRouter);
app.use('/raelectrical', raElectricalRouter);

// Basic health check
app.get('/', (req, res) => res.send('Backend is Active'));

const PORT = process.env.PORT || 5000;

// 6. IMPORTANT: Use server.listen, NOT app.listen
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
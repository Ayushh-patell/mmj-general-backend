const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Import HTTP
const { Server } = require('socket.io'); // 2. Import Socket.io
const tradifyRouter = require('./routes/TradifyRoute');
const zeejayRouter = require('./routes/ZeejayRoute');
const raElectricalRouter = require('./routes/RaElectricalRoute');

const app = express();

// --- SOCKET.IO SETUP ---
const server = http.createServer(app); // 3. Create HTTP Server
const io = new Server(server, {
  cors: {
    origin: [
      'https://tradifysolutions.com',
      'https://www.tradifysolutions.com',
      'https://raelectricalltd.com',
      'https://www.raelectricalltd.com',
      'https://raelectrical-site.web.app',
      'https://zeejaymechanical.web.app',
      'http://localhost:5173',
    ],
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'] // Recommended for Render.com stability
});

// 4. Share 'io' instance with your routers
app.set('socketio', io);

// --- CORS CONFIGURATION ---
const corsOptions = {
  origin: [
    'https://tradifysolutions.com',
    'https://www.tradifysolutions.com',
    'https://raelectricalltd.com',
    'https://www.raelectricalltd.com',
    'https://raelectrical-site.web.app',
    'http://localhost:5173',
  ],
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- ROUTES ---
app.use('/tradify', tradifyRouter);
app.use('/zeejay', zeejayRouter);
app.use('/raelectrical', raElectricalRouter);

// Basic health check
app.get('/', (req, res) => res.send('Backend is Active'));

// 5. Socket Connection Listener
io.on('connection', (socket) => {
  console.log(`📡 New client connected: ${socket.id}`);
  
  // Optional: Join a private room based on phone number 
  // (prevents sending everyone's replies to everyone else)
  socket.on('join_chat', (phoneNumber) => {
    socket.join(phoneNumber);
    console.log(`User joined room: ${phoneNumber}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;

// 6. IMPORTANT: Use server.listen, NOT app.listen
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
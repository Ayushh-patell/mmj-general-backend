const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Import HTTP
const { Server } = require('socket.io'); // 2. Import Socket.io
const tradifyRouter = require('./routes/TradifyRoute');
const zeejayRouter = require('./routes/ZeejayRoute');
const gurunanakRouter = require('./routes/GurunanakRoute');
const raElectricalRouter = require('./routes/RaElectricalRoute');
const userRoutes = require('./routes/blueboxx/user')
const orderRoutes = require('./routes/blueboxx/order')
const utilRoutes = require('./routes/blueboxx/utils')
const siteBridgeRoutes = require('./routes/blueboxx/siteBridge')

const connectZeejayDB = require('./utils/db');
const { default: helmet } = require('helmet');
const morgan = require('morgan');

const app = express();

// Resolve public dir from CWD (project root), not from this file’s folder
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');




// --- CORS CONFIGURATION ---
const corsOptions = {
  origin: [
    'https://tradifysolutions.com',
    'https://www.tradifysolutions.com',
    'https://raelectricalltd.com',
    'https://www.raelectricalltd.com',
    'https://raelectric.ca',
    'https://www.raelectric.ca',
    'https://gurunanakbakery.com',
    'https://www.gurunanakbakery.com',
    'https://raelectrical-site.web.app',
    'https://zeejaymechanical.web.app',
    'https://zeejaymechanical.com',
    'https://www.zeejaymechanical.com',
    'https://guru-nanak-bakery.web.app',
    'http://localhost:5173',
    'http://localhost:45678',
  ],
  optionsSuccessStatus: 200,
};




// ⚠️ STRIPE WEBHOOK ROUTE MUST COME BEFORE express.json()
// It needs access to the raw request body for signature verification.
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);
connectZeejayDB()


// Middlewares
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));


// Serve /<file> directly, e.g. /app-versions.json
app.use(express.static(PUBLIC_DIR, {
  maxAge: '1h',
  etag: true,
}));

// If you also want it under /public/...
app.use('/public', express.static(PUBLIC_DIR, {
  maxAge: '1h',
  etag: true,
}));




app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use('/uploads', express.static('uploads'));

// --- ROUTES ---
app.use('/tradify', tradifyRouter);
app.use('/zeejay', zeejayRouter);
app.use('/gurunanak', gurunanakRouter);
app.use('/raelectrical', raElectricalRouter);


// BLUEBOXX Routes
app.use('/blueboxx/api/user', userRoutes);
app.use('/blueboxx/api/order', orderRoutes);
app.use('/blueboxx/api/util', utilRoutes);
app.use('/blueboxx/api/site', siteBridgeRoutes);

// Basic health check
app.get('/', (req, res) => res.send('Backend is Active'));

const PORT = process.env.PORT || 5000;

// 6. IMPORTANT: Use server.listen, NOT app.listen
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
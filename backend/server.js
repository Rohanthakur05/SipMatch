require('dotenv').config();
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initChatSocket } = require('./sockets/chatSocket');

const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const app = express();

// ── HTTP middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── REST Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/upload',   require('./routes/uploadRoutes'));
app.use('/api/profile',  require('./routes/profileRoutes'));
app.use('/api',          require('./routes/swipeRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// ── HTTP + Socket.io server ───────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Reconnection handled client-side; keep transports explicit
  transports: ['websocket', 'polling'],
});

// Initialise chat socket handlers
initChatSocket(io);

httpServer.listen(port, () => {
  console.log(`Server started on port ${port} (HTTP + Socket.io)`);
});

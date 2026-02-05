/**
 * Main Server Entry Point
 * Initializes Express and Socket.IO server
 * Backend for round-based multiplayer card game
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (configure as needed for production)
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'poker-lite-backend'
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Poker Lite Backend',
    version: '1.0.0',
    description: 'Round-based multiplayer card game server',
    socketEvents: [
      'CREATE_ROOM',
      'JOIN_ROOM',
      'LEAVE_ROOM',
      'START_GAME',
      'PLAYER_ACTION',
      'REQUEST_SHOWDOWN',
      'START_NEW_ROUND',
      'GET_GAME_STATE'
    ]
  });
});

// Initialize Socket.IO handlers
const socketHandlers = require('./handlers/socketHandlers');
socketHandlers(io);

// Server configuration
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🎮 POKER LITE BACKEND SERVER');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

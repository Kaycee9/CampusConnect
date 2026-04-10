import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import env from './src/config/env.js';

const httpServer = createServer(app);

// ─── SOCKET.IO SETUP ─────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

// Socket handlers will be registered here in Stage 5
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible from routes/controllers
app.set('io', io);

// ─── START SERVER ─────────────────────────────────────────────────────────────

httpServer.listen(env.PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   CampusConnect API Server                ║
  ║   Port: ${env.PORT}                            ║
  ║   Env:  ${env.NODE_ENV.padEnd(18)}        ║
  ║   URL:  http://localhost:${env.PORT}            ║
  ╚═══════════════════════════════════════════╝
  `);
});

export { io };

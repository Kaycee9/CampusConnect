import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './src/app.js';
import env from './src/config/env.js';
import db from './src/config/database.js';
import { ensurePlatformLedgerAccounts } from './src/lib/ledger.js';

const httpServer = createServer(app);

// ─── SOCKET.IO SETUP ─────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    socket.user = decoded;
    return next();
  } catch (error) {
    return next(new Error('Invalid token'));
  }
});

// Socket handlers will be registered here in Stage 5
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  const userRoom = `user:${socket.user.userId}`;
  socket.join(userRoom);

  socket.on('conversation:join', ({ conversationId }) => {
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on('conversation:leave', ({ conversationId }) => {
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible from routes/controllers
app.set('io', io);

// ─── START SERVER ─────────────────────────────────────────────────────────────

const start = async () => {
  await ensurePlatformLedgerAccounts(db);

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
};

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { io };

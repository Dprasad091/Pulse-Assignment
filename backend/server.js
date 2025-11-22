// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const userRoutes = require('./routes/userRoutes');
const videoRoutes = require('./routes/videoRoutes');

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN }));

// simple logger
app.use((req, res, next) => { console.log(new Date().toISOString(), req.method, req.originalUrl); next(); });

// socket.io
const io = new Server(server, { cors: { origin: FRONTEND_ORIGIN, methods: ['GET','POST'] } });
app.set('socketio', io);
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('joinRoom', (roomId) => { if (roomId) socket.join(roomId); });
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', socket.id, reason));
});

// mount routes
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);

// multer error catcher (client-friendly)
const multer = require('multer');
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer middleware error', err);
    return res.status(400).json({ message: 'Upload error', error: err.message });
  }
  next(err);
});

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err && (err.stack || err));
  const status = err && err.status ? err.status : 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err && err.message) || 'Internal Server Error';
  res.status(status).json({ message, ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}) });
});

// connect to Mongo and start server
const start = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: true });
  console.log('MongoDB connected successfully');
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};
start().catch(err => { console.error('Startup failed:', err && (err.stack || err)); process.exit(1); });

// graceful shutdown
process.on('SIGINT', () => { console.log('SIGINT received, shutting down'); server.close(); mongoose.disconnect(); });
process.on('SIGTERM', () => { console.log('SIGTERM received, shutting down'); server.close(); mongoose.disconnect(); });

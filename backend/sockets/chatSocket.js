/**
 * chatSocket.js
 * Handles all real-time Socket.io events for the SipMatch chat system.
 *
 * Architecture:
 *  - Each match conversation lives in a Socket.io room named `match:<matchId>`
 *  - Every socket connection is authenticated via JWT before any room join
 *  - Sender identity is ALWAYS derived from the authenticated socket — never trusted from the client
 *  - All database writes (messages, match.lastActivity) happen server-side
 *
 * Events emitted by server → client:
 *   receive_message   { message }
 *   message_read      { matchId, readBy }
 *   typing_start      { matchId, userId }
 *   typing_stop       { matchId, userId }
 *   user_online       { userId }
 *   user_offline      { userId }
 *   error             { message }
 */

const jwt     = require('jsonwebtoken');
const mongoose = require('mongoose');
const User    = require('../models/User');
const Match   = require('../models/Match');
const Message = require('../models/Message');

const MAX_CONTENT_LENGTH = 2000;

// Track online users: userId → Set of socketIds (a user may have multiple tabs)
const onlineUsers = new Map();

// ── Auth helper ───────────────────────────────────────────────────────────────
const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password').lean();

    if (!user) {
      return next(new Error('User not found.'));
    }

    socket.user = user; // Attach authenticated user to socket
    next();
  } catch (err) {
    next(new Error('Invalid or expired token.'));
  }
};

// ── Participant guard ─────────────────────────────────────────────────────────
const assertMatchParticipant = async (matchId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(matchId)) {
    throw new Error('Invalid matchId.');
  }
  const match = await Match.findById(matchId).lean();
  if (!match) throw new Error('Match not found.');

  const ids = match.users.map((u) => u.toString());
  if (!ids.includes(userId.toString())) {
    throw new Error('Not authorised to access this conversation.');
  }

  const partnerId = ids.find((id) => id !== userId.toString());
  return { match, partnerId };
};

// ── Online tracking helpers ───────────────────────────────────────────────────
const addOnline = (userId, socketId) => {
  const userId$ = userId.toString();
  if (!onlineUsers.has(userId$)) onlineUsers.set(userId$, new Set());
  onlineUsers.get(userId$).add(socketId);
};

const removeOnline = (userId, socketId) => {
  const userId$ = userId.toString();
  const sockets = onlineUsers.get(userId$);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) onlineUsers.delete(userId$);
  }
};

const isOnline = (userId) => {
  const sockets = onlineUsers.get(userId.toString());
  return !!(sockets && sockets.size > 0);
};

// ── Main export ───────────────────────────────────────────────────────────────
const initChatSocket = (io) => {
  // Apply JWT auth middleware to all socket connections
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    addOnline(userId, socket.id);

    console.log(`[Socket] Connected: ${socket.user.name} (${socket.id})`);

    // Broadcast online status to everyone in the user's match rooms
    socket.rooms.forEach((room) => {
      if (room.startsWith('match:')) {
        socket.to(room).emit('user_online', { userId });
      }
    });

    // ── join_match ─────────────────────────────────────────────────────────
    socket.on('join_match', async ({ matchId }) => {
      try {
        const { partnerId } = await assertMatchParticipant(matchId, userId);
        const room = `match:${matchId}`;
        socket.join(room);

        // Tell the joiner if their partner is online
        socket.emit('user_online_status', {
          userId:   partnerId,
          isOnline: isOnline(partnerId),
        });

        console.log(`[Socket] ${socket.user.name} joined room ${room}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── leave_match ────────────────────────────────────────────────────────
    socket.on('leave_match', ({ matchId }) => {
      const room = `match:${matchId}`;
      socket.leave(room);
      console.log(`[Socket] ${socket.user.name} left room ${room}`);
    });

    // ── send_message ───────────────────────────────────────────────────────
    socket.on('send_message', async ({ matchId, content }) => {
      try {
        // 1. Validate content
        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Message content cannot be empty.' });
        }
        if (content.trim().length > MAX_CONTENT_LENGTH) {
          return socket.emit('error', { message: `Message too long (max ${MAX_CONTENT_LENGTH} chars).` });
        }

        // 2. Verify participation — NEVER trust sender from client
        const { partnerId } = await assertMatchParticipant(matchId, userId);

        // 3. Persist to MongoDB
        const message = await Message.create({
          match:       matchId,
          sender:      userId,
          receiver:    partnerId,
          content:     content.trim(),
          messageType: 'text',
        });

        // 4. Update Match.lastMessage + lastActivity
        await Match.findByIdAndUpdate(matchId, {
          lastMessage:  content.trim().slice(0, 100),
          lastActivity: new Date(),
        });

        // 5. Broadcast to everyone in the room (including sender for confirmation)
        const room = `match:${matchId}`;
        io.to(room).emit('receive_message', { message });

        console.log(`[Socket] Message sent in ${room} by ${socket.user.name}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── message_read ───────────────────────────────────────────────────────
    socket.on('message_read', async ({ matchId }) => {
      try {
        await assertMatchParticipant(matchId, userId);

        // Mark all unread messages in this conversation as read
        await Message.updateMany(
          { match: matchId, receiver: userId, read: false },
          { $set: { read: true } }
        );

        // Notify partner their messages were read
        const room = `match:${matchId}`;
        socket.to(room).emit('message_read', { matchId, readBy: userId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── typing_start ───────────────────────────────────────────────────────
    socket.on('typing_start', async ({ matchId }) => {
      try {
        await assertMatchParticipant(matchId, userId);
        socket.to(`match:${matchId}`).emit('typing_start', { matchId, userId });
      } catch {
        // Silently ignore typing events for invalid rooms
      }
    });

    // ── typing_stop ────────────────────────────────────────────────────────
    socket.on('typing_stop', async ({ matchId }) => {
      try {
        await assertMatchParticipant(matchId, userId);
        socket.to(`match:${matchId}`).emit('typing_stop', { matchId, userId });
      } catch {
        // Silently ignore
      }
    });

    // ── disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      removeOnline(userId, socket.id);
      console.log(`[Socket] Disconnected: ${socket.user.name} — reason: ${reason}`);

      // If user has no more active sockets, broadcast offline status
      if (!isOnline(userId)) {
        // Notify all rooms this user was in
        socket.rooms.forEach((room) => {
          if (room.startsWith('match:')) {
            socket.to(room).emit('user_offline', { userId });
          }
        });
      }
    });
  });
};

// Export online status checker for use in REST controllers if needed
module.exports = { initChatSocket, isOnline };

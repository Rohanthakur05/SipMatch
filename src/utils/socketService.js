/**
 * socketService.js
 * Singleton Socket.io client for SipMatch.
 *
 * Usage:
 *   import { getSocket, connectSocket, disconnectSocket } from './socketService';
 *
 *   // On app login:
 *   connectSocket(token);
 *
 *   // In a chat component:
 *   const socket = getSocket();
 *   socket.emit('join_match', { matchId });
 *   socket.on('receive_message', handler);
 *
 *   // On app logout:
 *   disconnectSocket();
 */

import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

/**
 * Connect (or reconnect) the socket with a fresh JWT token.
 * Safe to call multiple times — reuses existing connected socket.
 */
export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth:       { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay:    1000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
  });

  return socket;
};

/** Return the current socket instance (may be null if not yet connected). */
export const getSocket = () => socket;

/** Cleanly disconnect and destroy the socket instance. */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// src/config/socket.ts
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import Order from '../models/order.model';
import { UserRole } from '../types/user.types';
import { SOCKET_EVENTS } from '../types/notification.types';

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      const payload = verifyToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data.user;
    socket.join(`user:${userId}`);

    socket.on(SOCKET_EVENTS.JOIN_ORDER, async (orderId: string) => {
      if (!orderId) {
        return;
      }

      try {
        const order = await Order.findById(orderId);
        if (!order) {
          return;
        }

        const canJoin =
          (role === UserRole.CUSTOMER && order.customerId.toString() === userId) ||
          (role === UserRole.DELIVERY && order.deliveryPersonId?.toString() === userId) ||
          role === UserRole.ADMIN;

        if (canJoin) {
          socket.join(`order:${orderId}`);
        }
      } catch {
        // Ignore invalid join attempts
      }
    });
  });

  return io;
}

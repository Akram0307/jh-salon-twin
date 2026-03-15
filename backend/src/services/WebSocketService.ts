import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

import { pwaConciergeService, ConciergeMessage } from './PWAConciergeService';

interface ClientConnection {
  ws: WebSocket;
  salonId: string;
  userId?: string;
  clientId?: string; // For PWA clients
  isAuthenticated: boolean;
  subscriptions: Set<string>;
  connectedAt: Date;
  isPWA: boolean;
}

interface WSMessage {
  type: string;
  payload: any;
  timestamp: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sessionCleanupInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    // Heartbeat to detect stale connections
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, id) => {
        if (client.ws.readyState === WebSocket.CLOSED) {
          this.clients.delete(id);
        }
      });
    }, 30000);

    // Cleanup expired PWA sessions every 5 minutes
    this.sessionCleanupInterval = setInterval(async () => {
      try {
        const cleaned = await pwaConciergeService.cleanupExpiredSessions();
        if (cleaned > 0) {
          console.log(`🧹 Cleaned up ${cleaned} expired PWA sessions`);
        }
      } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
      }
    }, 5 * 60 * 1000);

    console.log('🔌 WebSocket server initialized on /ws');
  }

  private async handleConnection(ws: WebSocket, req: any) {
    const clientId = this.generateClientId();
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const salonId = url.searchParams.get('salon_id') || 'default';
    const userId = url.searchParams.get('user_id');
    const token = url.searchParams.get('token');
    const isPWA = url.searchParams.get('pwa') === 'true';

    // Authentication for PWA clients
    let isAuthenticated = false;
    let authenticatedUserId: string | undefined;

    if (isPWA && token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
        authenticatedUserId = decoded.userId || decoded.sub;
        isAuthenticated = true;
        console.log(`✅ PWA client authenticated: ${authenticatedUserId}`);
      } catch (error) {
        console.warn('⚠️ PWA client authentication failed:', error);
        ws.close(1008, 'Authentication failed');
        return;
      }
    }

    const client: ClientConnection = {
      ws,
      salonId,
      userId: authenticatedUserId || userId || undefined,
      clientId: isPWA ? clientId : undefined,
      isAuthenticated,
      subscriptions: new Set(['all']),
      connectedAt: new Date(),
      isPWA
    };

    this.clients.set(clientId, client);

    console.log(`🔌 WebSocket client connected: ${clientId} (salon: ${salonId}, PWA: ${isPWA}, Auth: ${isAuthenticated})`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      payload: {
        clientId,
        salonId,
        isPWA,
        isAuthenticated,
        message: isPWA 
          ? 'Connected to SalonOS PWA Concierge' 
          : 'Connected to SalonOS real-time updates'
      },
      timestamp: new Date().toISOString()
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (err) {
        console.error('Invalid WebSocket message:', err);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`🔌 WebSocket client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for client ${clientId}:`, err);
      this.clients.delete(clientId);
    });
  }

  private async handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Route PWA concierge messages to PWAConciergeService
    if (client.isPWA && message.type === 'ai_concierge_message') {
      try {
        // Forward to PWAConciergeService
        await pwaConciergeService.handleMessage(clientId, message as ConciergeMessage, client.ws);
      } catch (error) {
        console.error('Error handling PWA concierge message:', error);
        this.sendToClient(clientId, {
          type: 'error',
          payload: { error: 'Failed to process your message' },
          timestamp: new Date().toISOString()
        });
      }
      return;
    }

    // Handle typing indicators for PWA clients
    if (client.isPWA && message.type === 'typing_indicator') {
      // Broadcast typing indicator to other participants if needed
      // For now, just acknowledge
      this.sendToClient(clientId, {
        type: 'typing_ack',
        payload: { received: true },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle existing message types
    switch (message.type) {
      case 'subscribe':
        if (message.channels && Array.isArray(message.channels)) {
          message.channels.forEach((channel: string) => {
            client.subscriptions.add(channel);
          });
          this.sendToClient(clientId, {
            type: 'subscribed',
            payload: { channels: Array.from(client.subscriptions) },
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'unsubscribe':
        if (message.channels && Array.isArray(message.channels)) {
          message.channels.forEach((channel: string) => {
            client.subscriptions.delete(channel);
          });
        }
        break;

      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          payload: {},
          timestamp: new Date().toISOString()
        });
        break;

      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToClient(clientId: string, message: WSMessage) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  // Broadcast to all clients in a salon
  broadcastToSalon(salonId: string, message: WSMessage, channel?: string) {
    this.clients.forEach((client, clientId) => {
      if (client.salonId === salonId) {
        if (!channel || client.subscriptions.has(channel) || client.subscriptions.has('all')) {
          this.sendToClient(clientId, message);
        }
      }
    });
  }

  // Broadcast to all connected clients
  broadcastToAll(message: WSMessage, channel?: string) {
    this.clients.forEach((client, clientId) => {
      if (!channel || client.subscriptions.has(channel) || client.subscriptions.has('all')) {
        this.sendToClient(clientId, message);
      }
    });
  }

  // Emit appointment update event
  emitAppointmentUpdate(salonId: string, appointment: any, action: 'created' | 'updated' | 'cancelled') {
    this.broadcastToSalon(salonId, {
      type: 'appointment_update',
      payload: {
        action,
        appointment
      },
      timestamp: new Date().toISOString()
    }, 'appointments');
  }

  // Emit staff availability change event
  emitStaffAvailabilityChange(salonId: string, staffId: string, availability: any) {
    this.broadcastToSalon(salonId, {
      type: 'staff_availability_change',
      payload: {
        staffId,
        availability
      },
      timestamp: new Date().toISOString()
    }, 'staff');
  }

  // Emit new booking notification
  emitNewBooking(salonId: string, booking: any) {
    this.broadcastToSalon(salonId, {
      type: 'new_booking',
      payload: booking,
      timestamp: new Date().toISOString()
    }, 'bookings');
  }

  // Emit dashboard refresh signal
  emitDashboardRefresh(salonId: string, data?: any) {
    this.broadcastToSalon(salonId, {
      type: 'dashboard_refresh',
      payload: data || {},
      timestamp: new Date().toISOString()
    }, 'dashboard');
  }

  // Emit notification event
  emitNotification(salonId: string, userId: string | undefined, notification: any) {
    const message: WSMessage = {
      type: 'notification',
      payload: notification,
      timestamp: new Date().toISOString()
    };

    if (userId) {
      // Send to specific user
      this.clients.forEach((client, clientId) => {
        if (client.salonId === salonId && client.userId === userId) {
          this.sendToClient(clientId, message);
        }
      });
    } else {
      // Broadcast to salon
      this.broadcastToSalon(salonId, message, 'notifications');
    }
  }

  // Get connected clients count for a salon
  getConnectedClientsCount(salonId: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.salonId === salonId) {
        count++;
      }
    });
    return count;
  }

  // Get all connected clients info
  getConnectedClients(): Array<{ clientId: string; salonId: string; userId?: string; connectedAt: Date; isPWA: boolean }> {
    const result: Array<{ clientId: string; salonId: string; userId?: string; connectedAt: Date; isPWA: boolean }> = [];
    this.clients.forEach((client, clientId) => {
      result.push({
        clientId,
        salonId: client.salonId,
        userId: client.userId,
        connectedAt: client.connectedAt,
        isPWA: client.isPWA
      });
    });
    return result;
  }

  // Get PWA-specific client info
  getPWAClients(): Array<{ clientId: string; salonId: string; userId?: string; connectedAt: Date }> {
    const result: Array<{ clientId: string; salonId: string; userId?: string; connectedAt: Date }> = [];
    this.clients.forEach((client, clientId) => {
      if (client.isPWA) {
        result.push({
          clientId,
          salonId: client.salonId,
          userId: client.userId,
          connectedAt: client.connectedAt
        });
      }
    });
    return result;
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
    console.log('🔌 WebSocket server shut down');
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

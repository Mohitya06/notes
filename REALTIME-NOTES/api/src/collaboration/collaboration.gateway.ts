import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PagesService } from '../pages/pages.service';

interface ConnectedUser {
  userId: string;
  name: string;
  email: string;
  pageId: string | null;
  color: string;
}

const USER_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
];

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/collab',
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, ConnectedUser>();
  private colorIndex = 0;

  constructor(
    private jwtService: JwtService,
    private pagesService: PagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const color = USER_COLORS[this.colorIndex++ % USER_COLORS.length];

      this.connectedUsers.set(client.id, {
        userId: payload.sub,
        name: payload.name || payload.email,
        email: payload.email,
        pageId: null,
        color,
      });

      client.emit('connected', { socketId: client.id, color });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user?.pageId) {
      client.to(`page:${user.pageId}`).emit('user-left', {
        socketId: client.id,
        userId: user.userId,
      });
      this.broadcastPresence(user.pageId, client.id);
    }
    this.connectedUsers.delete(client.id);
  }

  // ─── Join a page room ─────────────────────────────────────────────────────

  @SubscribeMessage('join-page')
  async handleJoinPage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    if (user.pageId) {
      client.leave(`page:${user.pageId}`);
      this.broadcastPresence(user.pageId, client.id);
    }

    user.pageId = data.pageId;
    this.connectedUsers.set(client.id, user);
    client.join(`page:${data.pageId}`);

    const page = await this.pagesService.findById(data.pageId);
    const activeUsers = this.getPageUsers(data.pageId);

    client.emit('page-joined', { page, activeUsers });

    client.to(`page:${data.pageId}`).emit('user-joined', {
      socketId: client.id,
      userId: user.userId,
      name: user.name,
      color: user.color,
    });
  }

  // ─── Leave a page room ────────────────────────────────────────────────────

  @SubscribeMessage('leave-page')
  handleLeavePage(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (!user?.pageId) return;

    client.leave(`page:${user.pageId}`);
    client.to(`page:${user.pageId}`).emit('user-left', {
      socketId: client.id,
      userId: user.userId,
    });
    this.broadcastPresence(user.pageId, client.id);
    user.pageId = null;
    this.connectedUsers.set(client.id, user);
  }

  // ─── Block operations (insert / update / delete / move) ──────────────────

  @SubscribeMessage('operation')
  async handleOperation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      pageId: string;
      operation: {
        type: 'insertBlock' | 'updateBlock' | 'deleteBlock' | 'moveBlock';
        blockId?: string;
        block?: any;
        position?: number;
        newIndex?: number;
        content?: string;
      };
      clientOpId: string;
    },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    try {
      const { page, operation } = await this.pagesService.applyBlockOperation(
        data.pageId,
        data.operation,
        user.userId,
      );

      // Acknowledge to sender
      client.emit('operation-ack', {
        clientOpId: data.clientOpId,
        version: page.version,
        operation,
      });

      // Broadcast to everyone else in the room
      client.to(`page:${data.pageId}`).emit('remote-operation', {
        operation,
        userId: user.userId,
        name: user.name,
        color: user.color,
        version: page.version,
      });
    } catch (err) {
      client.emit('operation-error', {
        clientOpId: data.clientOpId,
        error: err.message,
      });
    }
  }

  // ─── Title update ─────────────────────────────────────────────────────────

  @SubscribeMessage('update-title')
  async handleUpdateTitle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; title: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    await this.pagesService.updateTitle(data.pageId, data.title, user.userId);

    client.to(`page:${data.pageId}`).emit('title-updated', {
      title: data.title,
      userId: user.userId,
    });
  }

  // ─── Cursor tracking ──────────────────────────────────────────────────────

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; blockId: string; offset: number },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    client.to(`page:${data.pageId}`).emit('cursor-update', {
      socketId: client.id,
      userId: user.userId,
      name: user.name,
      color: user.color,
      blockId: data.blockId,
      offset: data.offset,
    });
  }

  // ─── Typing indicator ─────────────────────────────────────────────────────

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; blockId: string; isTyping: boolean },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    client.to(`page:${data.pageId}`).emit('user-typing', {
      socketId: client.id,
      userId: user.userId,
      name: user.name,
      color: user.color,
      blockId: data.blockId,
      isTyping: data.isTyping,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getPageUsers(pageId: string, excludeSocketId?: string) {
    const users: any[] = [];
    this.connectedUsers.forEach((user, socketId) => {
      if (user.pageId === pageId && socketId !== excludeSocketId) {
        users.push({ socketId, userId: user.userId, name: user.name, color: user.color });
      }
    });
    return users;
  }

  private broadcastPresence(pageId: string, excludeSocketId: string) {
    const users = this.getPageUsers(pageId, excludeSocketId);
    this.server.to(`page:${pageId}`).emit('presence-update', { users });
  }
}

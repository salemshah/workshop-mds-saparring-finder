import { Server as SocketIOServer, Socket } from 'socket.io';
import { Container } from 'typedi';
import { verifyAccessToken } from '../utils/jwt';
import { MessageService } from '../services/message.service';
import { ConversationService } from '../services/conversation.service';
import { NotificationService } from '../services/notification.service';

interface JwtPayload {
  id: number;
}

// Payload interfaces
interface JoinConversationPayload {
  conversationId: number;
}

interface SendMessagePayload {
  conversationId: number;
  content: string;
  messageType?: string;
  mediaUrl?: string;
}

interface MessageReadPayload {
  conversationId: number;
  messageId: number;
}

interface TypingPayload {
  conversationId: number;
  isTyping: boolean;
}

/**
 * Utility: room name for a given conversation.
 */
function roomName(conversationId: number): string {
  return `conversation_${conversationId}`;
}

/**
 * Type guard for objects that might have a `conversationId: number` property.
 */
function isJoinPayload(obj: unknown): obj is JoinConversationPayload {
  if (
    typeof obj === 'object' &&
    obj !== null &&
    'conversationId' in obj &&
    typeof (obj as Record<string, unknown>).conversationId === 'number'
  ) {
    return true;
  }
  return false;
}

/**
 * Type guard for SendMessagePayload.
 */
function isSendMessagePayload(obj: unknown): obj is SendMessagePayload {
  if (
    typeof obj === 'object' &&
    obj !== null &&
    'conversationId' in obj &&
    'content' in obj &&
    typeof (obj as Record<string, unknown>).conversationId === 'number' &&
    typeof (obj as Record<string, unknown>).content === 'string'
  ) {
    return true;
  }
  return false;
}

/**
 * Type guard for MessageReadPayload.
 */
function isMessageReadPayload(obj: unknown): obj is MessageReadPayload {
  if (
    typeof obj === 'object' &&
    obj !== null &&
    'conversationId' in obj &&
    'messageId' in obj &&
    typeof (obj as Record<string, unknown>).conversationId === 'number' &&
    typeof (obj as Record<string, unknown>).messageId === 'number'
  ) {
    return true;
  }
  return false;
}

/**
 * Type guard for TypingPayload.
 */
function isTypingPayload(obj: unknown): obj is TypingPayload {
  if (
    typeof obj === 'object' &&
    obj !== null &&
    'conversationId' in obj &&
    'isTyping' in obj &&
    typeof (obj as Record<string, unknown>).conversationId === 'number' &&
    typeof (obj as Record<string, unknown>).isTyping === 'boolean'
  ) {
    return true;
  }
  return false;
}

export default function socketLoader(io: SocketIOServer) {
  const messageService = Container.get(MessageService);
  const conversationService = Container.get(ConversationService);
  const notificationService = Container.get(NotificationService);

  // -------------------------------------------------------------
  // 1) Authenticate each incoming socket connection
  // -------------------------------------------------------------
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        console.warn(`[SocketAuth] Missing token on socket ${socket.id}`);
        return next(new Error('Authentication token missing'));
      }
      const payload = verifyAccessToken(token) as JwtPayload;
      socket.data.userId = payload.id;
      return next();
    } catch (err) {
      console.error(`[SocketAuth] Error validating token:`, err);
      return next(new Error('Authentication error'));
    }
  });

  // -------------------------------------------------------------
  // 2) Handle each new connection
  // -------------------------------------------------------------
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as number;
    console.info(`[Socket] User ${userId} connected (socket ${socket.id})`);

    /**
     * Helper: Check whether `userId` is in the conversation. If not,
     * emit an error with context and return false.
     */
    async function guardParticipant(
      conversationId: number,
      contextEvent: string
    ): Promise<boolean> {
      try {
        const isPart = await conversationService.isParticipant(
          conversationId,
          userId
        );
        if (!isPart) {
          socket.emit('error', {
            message: `Not a participant of conversation ${conversationId}`,
            context: contextEvent,
          });
          return false;
        }
        return true;
      } catch (err) {
        console.error(
          `[Guard][${contextEvent}] Error checking participant:`,
          err
        );
        socket.emit('error', {
          message: 'Internal error checking permissions',
          context: contextEvent,
        });
        return false;
      }
    }

    // --------------------------
    // a) join_conversation
    // --------------------------
    socket.on('join_conversation', async (rawData: unknown) => {
      const eventName = 'join_conversation';
      if (!isJoinPayload(rawData)) {
        socket.emit('error', {
          message: 'Invalid payload for join_conversation',
          context: eventName,
        });
        return;
      }
      const { conversationId } = rawData;

      // 1) Verify this user is a participant
      const allowed = await guardParticipant(conversationId, eventName);
      if (!allowed) return;

      // 2) Join the room
      socket.join(roomName(conversationId));
      console.info(
        `[Socket] User ${userId} joined room ${roomName(conversationId)}`
      );

      // 3) Mark as read & fetch last 50 messages in parallel
      try {
        const markReadPromise = conversationService.markAsRead(
          conversationId,
          userId
        );
        const historyPromise = messageService.getConversationByConversationId(
          userId,
          conversationId,
          { page: 1, limit: 50 }
        );

        const [, { messages }] = await Promise.all([
          markReadPromise,
          historyPromise,
        ]);

        // 4) Emit ACK and then history
        socket.emit('join_conversation_ack', { conversationId });
        socket.emit('conversation_history', { conversationId, messages });
      } catch (err) {
        console.error(`[${eventName}] DB error:`, err);
        socket.emit('error', {
          message: 'Could not join conversation (DB failure).',
          context: eventName,
        });
      }
    });

    // --------------------------
    // b) leave_conversation
    // --------------------------
    socket.on('leave_conversation', (rawData: unknown) => {
      const eventName = 'leave_conversation';
      if (!isJoinPayload(rawData)) {
        socket.emit('error', {
          message: 'Invalid payload for leave_conversation',
          context: eventName,
        });
        return;
      }
      const { conversationId } = rawData;
      socket.leave(roomName(conversationId));
      console.info(
        `[Socket] User ${userId} left room ${roomName(conversationId)}`
      );
    });

    // --------------------------
    // c) send_message
    // --------------------------
    socket.on('send_message', async (rawData: unknown) => {
      const eventName = 'send_message';
      if (!isSendMessagePayload(rawData)) {
        socket.emit('error', {
          message: 'Invalid payload for send_message',
          context: eventName,
        });
        return;
      }
      const { conversationId, content, messageType, mediaUrl } = rawData;

      // 1) Verify participant membership
      const allowed = await guardParticipant(conversationId, eventName);
      if (!allowed) return;

      // 2) Persist the new message
      let newMsg;
      try {
        const result = await messageService.createMessage({
          fromUserId: userId,
          conversationId,
          content,
          messageType: messageType ?? 'text',
          mediaUrl: mediaUrl ?? null,
        });
        newMsg = result.message;
        console.debug(
          `[${eventName}] Persisted msg=${newMsg.id} in convo=${conversationId}`
        );
      } catch (err) {
        console.error(`[${eventName}] Error creating message:`, err);
        socket.emit('error', {
          message: 'Could not persist message',
          context: eventName,
        });
        return;
      }

      // 3) Mark conversation as read for the sender (fire & forget)
      conversationService
        .markAsRead(conversationId, userId)
        .catch((err) =>
          console.error(
            `[${eventName}] Warning: markAsRead failed for user=${userId}, convo=${conversationId}:`,
            err
          )
        );

      // 4) Broadcast to everyone in that room exactly once
      io.to(roomName(conversationId)).emit('new_message', {
        conversationId,
        message: newMsg,
      });
      console.info(
        `[${eventName}] Broadcasted "new_message" to ${roomName(conversationId)}`
      );

      // 5) Send push notifications to all other participants (fire & forget)
      setImmediate(async () => {
        try {
          const allParticipantIds =
            await conversationService.getParticipantIds(conversationId);

          // Build a title/body for the notification
          const senderProfile =
            await conversationService.getParticipantProfile(userId);
          const title = `New message from ${senderProfile.displayName}`;
          const body =
            content.length > 40 ? content.slice(0, 37) + '...' : content;

          // Send a notification to each recipient (except the sender)
          const notifyPromises: Promise<void>[] = [];
          for (const recipientId of allParticipantIds) {
            if (recipientId === userId) continue;
            notifyPromises.push(
              notificationService.createAndSend({
                recipientId,
                senderId: userId,
                title,
                body,
                type: 'new_message',
                via: 'push',
                actionUrl: `/conversations/${conversationId}`,
                data: {
                  screen: 'chat',
                  title: senderProfile.displayName,
                  conversationId: conversationId.toString(),
                },
              })
            );
          }

          await Promise.all(notifyPromises);
          console.debug(
            `[${eventName}] Notifications dispatched for message ${newMsg.id}`
          );
        } catch (notifErr) {
          console.error(
            `[${eventName}] Notification dispatch failed:`,
            notifErr
          );
        }
      });
    });

    // --------------------------
    // d) message_read
    // --------------------------
    socket.on('message_read', async (rawData: unknown) => {
      const eventName = 'message_read';
      if (!isMessageReadPayload(rawData)) {
        socket.emit('error', {
          message: 'Invalid payload for message_read',
          context: eventName,
        });
        return;
      }
      const { conversationId, messageId } = rawData;

      // Verify participant
      const allowed = await guardParticipant(conversationId, eventName);
      if (!allowed) return;

      try {
        // Run both updates in parallel
        const markConvoRead = conversationService.markAsRead(
          conversationId,
          userId
        );
        const markMsgRead = messageService.markAsRead(
          conversationId,
          userId,
          messageId
        );
        await Promise.all([markConvoRead, markMsgRead]);

        // Broadcast read receipt
        io.to(roomName(conversationId)).emit('message_read_ack', {
          conversationId,
          messageId,
          userId,
        });
      } catch (err) {
        console.error(`[${eventName}] Error:`, err);
        socket.emit('error', {
          message: 'Could not mark message as read',
          context: eventName,
        });
      }
    });

    // --------------------------
    // e) typing indicator
    // --------------------------
    socket.on('typing', (rawData: unknown) => {
      const eventName = 'typing';
      if (!isTypingPayload(rawData)) {
        socket.emit('error', {
          message: 'Invalid payload for typing',
          context: eventName,
        });
        return;
      }
      const { conversationId, isTyping } = rawData;
      socket.to(roomName(conversationId)).emit('typing', {
        conversationId,
        userId,
        isTyping,
      });
    });

    // --------------------------
    // f) disconnect
    // --------------------------
    socket.on('disconnect', (reason) => {
      console.info(
        `[Socket] User ${userId} disconnected (socket ${socket.id}): ${reason}`
      );
      // Socket.IO automatically removes the socket from all rooms
    });
  });
}

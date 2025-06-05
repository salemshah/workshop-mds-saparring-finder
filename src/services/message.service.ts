import { Service } from 'typedi';
import prisma from '../prisma/client';
import CustomError from '../utils/customError';

export interface ConversationParams {
  page: number;
  limit: number;
}

export interface ConversationResponse {
  messages: Array<{
    id: number;
    conversation_id: number;
    sender_id: number;
    receiver_id: number | null;
    content: string;
    message_type: string;
    media_url?: string | null;
    is_read: boolean;
    sent_at: Date;
    read_at?: Date | null;
    deleted_by_sender: boolean;
    deleted_by_receiver: boolean;
    sender: {
      id: number;
      profile: {
        first_name: string;
        last_name: string;
        photo_url: string;
      } | null;
    };
    receiver: {
      id: number;
      profile: {
        first_name: string;
        last_name: string;
        photo_url: string;
      } | null;
    } | null;
  }>;
}

export interface GetMessageResponse {
  message: {
    id: number;
    conversation_id: number;
    sender_id: number;
    receiver_id: number | null;
    content: string;
    message_type: string;
    media_url?: string | null;
    is_read: boolean;
    sent_at: Date;
    read_at?: Date | null;
    deleted_by_sender: boolean;
    deleted_by_receiver: boolean;
    sender: {
      id: number;
      profile: {
        first_name: string;
        last_name: string;
        photo_url: string;
      } | null;
    };
    receiver: {
      id: number;
      profile: {
        first_name: string;
        last_name: string;
        photo_url: string;
      } | null;
    } | null;
  };
}

export interface CreateMessagePayload {
  fromUserId: number;
  conversationId: number;
  content: string;
  messageType?: string;
  mediaUrl?: string | null;
}

export interface CreateMessageResponse {
  message: GetMessageResponse['message'];
}

export interface UpdateMessagePayload {
  messageId: number;
  userId: number;
  content?: string;
  messageType?: string;
  mediaUrl?: string | null;
}

export interface UpdateMessageResponse {
  message: GetMessageResponse['message'];
}

export interface DeleteMessageResponse {
  messageId: number;
  deletedFor: 'sender' | 'receiver';
}

@Service()
export class MessageService {
  /**
   * Create a new message in a conversation.
   * `receiver_id` is set only if there is exactly one other participant.
   */
  async createMessage(
    payload: CreateMessagePayload
  ): Promise<CreateMessageResponse> {
    const {
      fromUserId,
      conversationId,
      content,
      messageType = 'text',
      mediaUrl,
    } = payload;

    // Look up participants of this conversation to find “other” user (for 1:1)
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversation_id: conversationId },
      select: { user_id: true },
    });
    const other = participants.find((p) => p.user_id !== fromUserId);
    // If there is exactly one “other” user, set it as receiver_id; otherwise null.
    const receiverId = other ? other.user_id : null;

    const newMsg = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: fromUserId,
        receiver_id: receiverId,
        content,
        message_type: messageType,
        media_url: mediaUrl ?? null,
        is_read: false,
        deleted_by_sender: false,
        deleted_by_receiver: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: { first_name: true, last_name: true, photo_url: true },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            profile: {
              select: { first_name: true, last_name: true, photo_url: true },
            },
          },
        },
      },
    });

    return { message: newMsg };
  }

  /**
   * Fetch a paginated list of messages in a conversation, ordered by sent_at ascending.
   * Excludes messages that have been soft‐deleted by the requesting user.
   *
   * @param conversationId  The ID of the conversation to fetch.
   * @param params          { page, limit } for pagination.
   * @param userId          The ID of the authenticated user (used to filter out deleted messages
   *                        and enforce “participant” checks).
   */
  async getConversationByConversationId(
    userId: number,
    conversationId: number,
    params: ConversationParams
  ): Promise<ConversationResponse> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    // Verify that the user is indeed a participant in this conversation:
    const isPart = await prisma.conversationParticipant.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });
    if (!isPart) {
      throw new CustomError(
        'Not a participant of this conversation',
        403,
        'FORBIDDEN'
      );
    }

    // Now fetch messages that are not soft‐deleted for this user
    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId,
        AND: [
          {
            OR: [
              { sender_id: userId, deleted_by_sender: false },
              { receiver_id: userId, deleted_by_receiver: false },
            ],
          },
        ],
      },
      orderBy: { sent_at: 'asc' },
      skip,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: { first_name: true, last_name: true, photo_url: true },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            profile: {
              select: { first_name: true, last_name: true, photo_url: true },
            },
          },
        },
      },
    });

    return { messages };
  }

  /**
   * Fetch a single message by ID (only if the user is a participant
   * and the message isn’t soft‐deleted for them). Throws 404 or 403 otherwise.
   */
  async getMessageById(
    messageId: number,
    userId: number
  ): Promise<GetMessageResponse> {
    if (isNaN(messageId)) {
      throw new CustomError('Invalid message ID', 400, 'INVALID_MESSAGE_ID');
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: { first_name: true, last_name: true, photo_url: true },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            profile: {
              select: { first_name: true, last_name: true, photo_url: true },
            },
          },
        },
      },
    });

    if (!message) {
      throw new CustomError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Check that the user is a participant in this conversation
    const isPart = await prisma.conversationParticipant.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: message.conversation_id,
          user_id: userId,
        },
      },
    });
    if (!isPart) {
      throw new CustomError('Not authorized', 403, 'FORBIDDEN');
    }

    // If this message has been soft‐deleted for this user, treat it as not found
    if (
      (message.sender_id === userId && message.deleted_by_sender) ||
      (message.receiver_id === userId && message.deleted_by_receiver)
    ) {
      throw new CustomError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    return { message };
  }

  /**
   * Update a message’s content, type, or media. Only the original sender may do so,
   * and only if they haven’t already soft‐deleted it.
   */
  async updateMessage(
    payload: UpdateMessagePayload
  ): Promise<UpdateMessageResponse> {
    const { messageId, userId, content, messageType, mediaUrl } = payload;

    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!existing) {
      throw new CustomError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Only the sender can update
    if (existing.sender_id !== userId) {
      throw new CustomError('Not authorized to edit', 403, 'FORBIDDEN');
    }

    // If the sender has soft‐deleted it, they cannot edit
    if (existing.deleted_by_sender) {
      throw new CustomError('Message already deleted', 400, 'ALREADY_DELETED');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(messageType !== undefined ? { message_type: messageType } : {}),
        ...(mediaUrl !== undefined ? { media_url: mediaUrl } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: { first_name: true, last_name: true, photo_url: true },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            profile: {
              select: { first_name: true, last_name: true, photo_url: true },
            },
          },
        },
      },
    });

    return { message: updated };
  }

  /**
   * Soft‐delete a message for the calling user. If both sides delete,
   * the message row remains for archival but can be purged later.
   */
  async deleteMessage(
    messageId: number,
    userId: number
  ): Promise<DeleteMessageResponse> {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!existing) {
      throw new CustomError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    let updateData: Partial<typeof existing> = {};
    let deletedFor: 'sender' | 'receiver';

    if (existing.sender_id === userId) {
      if (existing.deleted_by_sender) {
        throw new CustomError(
          'Message already deleted',
          400,
          'ALREADY_DELETED'
        );
      }
      updateData = { deleted_by_sender: true };
      deletedFor = 'sender';
    } else if (existing.receiver_id === userId) {
      if (existing.deleted_by_receiver) {
        throw new CustomError(
          'Message already deleted',
          400,
          'ALREADY_DELETED'
        );
      }
      updateData = { deleted_by_receiver: true };
      deletedFor = 'receiver';
    } else {
      throw new CustomError('Not authorized', 403, 'FORBIDDEN');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });

    return { messageId, deletedFor };
  }

  /**
   * Mark a single message as read by updating its `is_read` and `read_at`.
   * Only a participant in the conversation may mark as read.
   */
  async markAsRead(
    conversationId: number,
    userId: number,
    messageId: number
  ): Promise<void> {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!existing) {
      throw new CustomError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Verify that the user is a participant in this conversation
    const isPart = await prisma.conversationParticipant.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });
    if (!isPart) {
      throw new CustomError('Not a participant', 403, 'FORBIDDEN');
    }

    // If it’s already marked read, do nothing
    if (existing.is_read) {
      return;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }
}

// src/services/conversation.service.ts

import { Service } from 'typedi';
import prisma from '../prisma/client';
import CustomError from '../utils/customError';

export interface ConversationSummary {
  id: number;
  name: string;
  avatarUrl: string;
  lastMessage: string;
  lastSentAt: Date;
  unreadCount: number;
}

@Service()
export class ConversationService {
  /**
   * Check whether user is a participant in the conversation.
   */
  async isParticipant(
    conversationId: number,
    userId: number
  ): Promise<boolean> {
    const count = await prisma.conversationParticipant.count({
      where: { conversation_id: conversationId, user_id: userId },
    });
    return count > 0;
  }

  /**
   * Mark entire conversation as read for this user.
   */
  async markAsRead(conversationId: number, userId: number): Promise<void> {
    await prisma.conversationParticipant.updateMany({
      where: { conversation_id: conversationId, user_id: userId },
      data: { last_read_at: new Date() },
    });
  }

  /**
   * Count unread messages for a given conversation & user.
   */
  async countUnread(conversationId: number, userId: number): Promise<number> {
    const cp = await prisma.conversationParticipant.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      select: { last_read_at: true },
    });
    const lastRead = cp?.last_read_at;
    if (!lastRead) {
      return prisma.message.count({
        where: {
          conversation_id: conversationId,
          sender_id: { not: userId },
        },
      });
    }
    return prisma.message.count({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        sent_at: { gt: lastRead },
      },
    });
  }

  /**
   * List all conversations (1:1 or group) for a given userId,
   * returning a summary object for each.
   */
  async listConversations(userId: number): Promise<ConversationSummary[]> {
    const participantRows = await prisma.conversationParticipant.findMany({
      where: { user_id: userId },
      select: { conversation_id: true },
    });
    const convoIds = participantRows.map((p) => p.conversation_id);
    if (convoIds.length === 0) return [];

    const summaries: ConversationSummary[] = [];

    for (const convoId of convoIds) {
      const convo = await prisma.conversation.findUnique({
        where: { id: convoId },
        select: {
          id: true,
          is_group: true,
          title: true,
          created_at: true,
        },
      });
      if (!convo) continue;

      let name = '';
      let avatarUrl = '';

      if (convo.is_group) {
        name = convo.title ?? 'Group Chat';
        avatarUrl = '';
      } else {
        const otherRow = await prisma.conversationParticipant.findFirst({
          where: {
            conversation_id: convoId,
            user_id: { not: userId },
          },
          select: { user_id: true },
        });
        if (otherRow) {
          const otherUser = await prisma.user.findUnique({
            where: { id: otherRow.user_id },
            select: {
              profile: {
                select: { first_name: true, last_name: true, photo_url: true },
              },
            },
          });
          if (otherUser?.profile) {
            name = `${otherUser.profile.first_name} ${otherUser.profile.last_name}`;
            avatarUrl = otherUser.profile.photo_url;
          }
        }
      }

      const lastMsg = await prisma.message.findFirst({
        where: { conversation_id: convoId },
        orderBy: { sent_at: 'desc' },
        select: { content: true, sent_at: true },
      });
      const lastMessage = lastMsg?.content ?? '';
      const lastSentAt = lastMsg?.sent_at ?? convo.created_at;

      const cp = await prisma.conversationParticipant.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: convoId,
            user_id: userId,
          },
        },
        select: { last_read_at: true },
      });
      const lastRead = cp?.last_read_at;
      let unreadCount = 0;
      if (!lastRead) {
        unreadCount = await prisma.message.count({
          where: {
            conversation_id: convoId,
            sender_id: { not: userId },
          },
        });
      } else {
        unreadCount = await prisma.message.count({
          where: {
            conversation_id: convoId,
            sender_id: { not: userId },
            sent_at: { gt: lastRead },
          },
        });
      }

      summaries.push({
        id: convoId,
        name,
        avatarUrl,
        lastMessage,
        lastSentAt,
        unreadCount,
      });
    }

    summaries.sort((a, b) => b.lastSentAt.getTime() - a.lastSentAt.getTime());
    return summaries;
  }

  /**
   * Create a new conversation (1:1 or group).
   * For 1:1 (two participants), reuses any existing chat between them.
   */
  async createConversation(params: {
    participantIds: number[];
    title?: string;
    avatarUrl?: string;
  }): Promise<ConversationSummary> {
    const { participantIds, title, avatarUrl } = params;
    if (participantIds.length < 2) {
      throw new CustomError(
        'At least two participants are required',
        400,
        'INVALID_PAYLOAD'
      );
    }

    // If exactly two participants, return existing or create new single chat
    if (participantIds.length === 2) {
      const [userA, userB] = participantIds;
      const convoId = await this.getOrCreateOneOnOneConversation(userA, userB);

      // Build a minimal summary
      // 1) Determine the “other” user (if userA is calling this, userB is other)
      //    We don't know who is “current user” here, so simply pick the first ID
      //    to fetch profiles for naming. The UI can override if needed.
      const otherUserId = userB;

      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: {
          profile: {
            select: { first_name: true, last_name: true, photo_url: true },
          },
        },
      });

      let name = 'Chat';
      let avatar = '';
      if (otherUser?.profile) {
        name = `${otherUser.profile.first_name} ${otherUser.profile.last_name}`;
        avatar = otherUser.profile.photo_url;
      }

      // 2) Fetch most recent message (if any)
      const lastMsg = await prisma.message.findFirst({
        where: { conversation_id: convoId },
        orderBy: { sent_at: 'desc' },
        select: { content: true, sent_at: true },
      });
      const lastMessage = lastMsg?.content ?? '';
      const lastSentAt = lastMsg?.sent_at ?? new Date();

      // 3) unreadCount is 0 upon creation or retrieval
      return {
        id: convoId,
        name,
        avatarUrl: avatar,
        lastMessage,
        lastSentAt,
        unreadCount: 0,
      };
    }

    // Otherwise (group chat), proceed as before
    const newConvo = await prisma.conversation.create({
      data: {
        is_group: participantIds.length > 2,
        title: participantIds.length > 2 ? title : null,
      },
    });
    const convoId = newConvo.id;

    const now = new Date();
    await prisma.conversationParticipant.createMany({
      data: participantIds.map((userId) => ({
        conversation_id: convoId,
        user_id: userId,
        last_read_at: now,
      })),
    });

    let name = '';
    let avatar = '';
    if (participantIds.length === 2) {
      const otherId =
        participantIds.find((id) => id !== participantIds[0]) ??
        participantIds[1];
      const userRow = await prisma.user.findUnique({
        where: { id: otherId },
        select: {
          profile: {
            select: { first_name: true, last_name: true, photo_url: true },
          },
        },
      });
      if (userRow?.profile) {
        name = `${userRow.profile.first_name} ${userRow.profile.last_name}`;
        avatar = userRow.profile.photo_url;
      }
    } else {
      name = title ?? 'Group Chat';
      avatar = avatarUrl ?? '';
    }

    return {
      id: convoId,
      name,
      avatarUrl: avatar,
      lastMessage: '',
      lastSentAt: now,
      unreadCount: 0,
    };
  }

  /**
   * Delete an existing conversation.
   * Only a participant may delete. This will also delete all messages and participants.
   */
  async deleteConversation(
    conversationId: number,
    userId: number
  ): Promise<void> {
    const count = await prisma.conversationParticipant.count({
      where: { conversation_id: conversationId, user_id: userId },
    });
    if (count === 0) {
      throw new CustomError('Not authorized to delete', 403, 'FORBIDDEN');
    }

    await prisma.message.deleteMany({
      where: { conversation_id: conversationId },
    });
    await prisma.conversationParticipant.deleteMany({
      where: { conversation_id: conversationId },
    });
    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Return an array of all user IDs who participate in the given conversation.
   */
  async getParticipantIds(conversationId: number): Promise<number[]> {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversation_id: conversationId },
      select: { user_id: true },
    });
    return participants.map((p) => p.user_id);
  }

  /**
   * Return a minimal profile for a given userId.
   * If the user (or their profile) is missing, returns a default fallback.
   */
  async getParticipantProfile(userId: number): Promise<{
    displayName: string;
    photoUrl: string | null;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: {
          select: {
            first_name: true,
            last_name: true,
            photo_url: true,
          },
        },
      },
    });

    if (!user?.profile) {
      return {
        displayName: 'Someone',
        photoUrl: null,
      };
    }

    const { first_name, last_name, photo_url } = user.profile;
    const displayName = `${first_name} ${last_name}`.trim() || 'Someone';
    return {
      displayName,
      photoUrl: photo_url ?? null,
    };
  }

  /**
   * INTERNAL: Attempt to find an existing 1-on-1 conversation between userA & userB.
   * Returns the conversationId if found, otherwise `null`.
   */
  private async findOneOnOneConversation(
    userA: number,
    userB: number
  ): Promise<number | null> {
    const participantRows = await prisma.conversationParticipant.findMany({
      where: { user_id: userA },
      select: { conversation_id: true },
    });
    const convoIds = participantRows.map((r) => r.conversation_id);
    if (convoIds.length === 0) return null;

    const existing = await prisma.conversation.findFirst({
      where: {
        id: { in: convoIds },
        is_group: false,
        participants: {
          every: {
            user_id: { in: [userA, userB] },
          },
        },
      },
      select: { id: true },
    });

    if (!existing) return null;

    const countParticipants = await prisma.conversationParticipant.count({
      where: { conversation_id: existing.id },
    });
    if (countParticipants === 2) {
      return existing.id;
    }
    return null;
  }

  /**
   * Public method: Get or create a 1-on-1 conversation between userA & userB.
   * - If one already exists, returns its ID.
   * - Otherwise, creates a new conversation (is_group = false) with those two participants.
   */
  async getOrCreateOneOnOneConversation(
    userA: number,
    userB: number
  ): Promise<number> {
    if (userA === userB) {
      throw new CustomError(
        'Cannot start a 1-on-1 conversation with yourself',
        400,
        'INVALID_PAYLOAD'
      );
    }

    const existingId = await this.findOneOnOneConversation(userA, userB);
    if (existingId !== null) {
      return existingId;
    }

    const newConvo = await prisma.conversation.create({
      data: {
        is_group: false,
        title: null,
      },
    });
    const convoId = newConvo.id;

    const now = new Date();
    await prisma.conversationParticipant.createMany({
      data: [
        { conversation_id: convoId, user_id: userA, last_read_at: now },
        { conversation_id: convoId, user_id: userB, last_read_at: now },
      ],
    });

    return convoId;
  }
}

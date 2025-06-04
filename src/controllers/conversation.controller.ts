// src/controllers/conversation.controller.ts

import { Request, Response } from 'express';
import { Service } from 'typedi';
import CustomError from '../utils/customError';
import {
  ConversationService,
  ConversationSummary,
} from '../services/conversation.service';
import { asyncWrapper } from '../utils/asyncWrapper';

@Service()
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  /**
   * POST /conversations/one-on-one/:otherUserId
   * If A and B already share a 1-on-1, returns that ID.
   * Otherwise, creates a new 1-on-1 conversation.
   */
  public getOrCreateOneOnOne = asyncWrapper(
    async (req: Request, res: Response) => {
      const userA = req.user.id as number;
      const otherUserId = Number(req.params.otherUserId);
      if (isNaN(otherUserId)) {
        throw new CustomError('Invalid user ID', 400, 'INVALID_ID');
      }

      if (otherUserId === userA) {
        throw new CustomError(
          'Cannot create a 1-on-1 chat with yourself',
          400,
          'INVALID_PAYLOAD'
        );
      }

      // This returns an existing 1-on-1 ID or creates a new one.
      const conversationId =
        await this.conversationService.getOrCreateOneOnOneConversation(
          userA,
          otherUserId
        );

      // Return just the ID (UI can infer “name” from otherUser’s profile if needed)
      return res.status(200).json({ conversation: { id: conversationId } });
    }
  );

  /**
   * GET /conversations
   * List all conversations for the authenticated user.
   */
  listConversations = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id as number;
    const summaries: ConversationSummary[] =
      await this.conversationService.listConversations(userId);
    return res.status(200).json({ conversations: summaries });
  });

  /**
   * POST /conversations
   * Create a new conversation between the specified participant IDs.
   * Body: { participantIds: number[], title?: string, avatarUrl?: string }
   */
  createConversation = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id as number;
    const body = req.body as {
      participantIds: number[];
      title?: string;
      avatarUrl?: string;
    };

    // Always ensure the authenticated user is included in participantIds
    if (!body.participantIds.includes(userId)) {
      body.participantIds.push(userId);
    }

    if (body.participantIds.length < 2) {
      throw new CustomError(
        'At least two participants are required',
        400,
        'INVALID_PAYLOAD'
      );
    }

    const summary = await this.conversationService.createConversation({
      participantIds: body.participantIds,
      title: body.title,
      avatarUrl: body.avatarUrl,
    });

    return res.status(201).json({ conversation: summary });
  });

  /**
   * DELETE /conversations/:id
   * Delete a conversation (only if the requester is a participant).
   */
  deleteConversationById = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id as number;
    const convoId = Number(req.params.id);
    if (isNaN(convoId)) {
      throw new CustomError('Invalid conversation ID', 400, 'INVALID_ID');
    }

    await this.conversationService.deleteConversation(convoId, userId);
    return res
      .status(200)
      .json({ message: 'Conversation deleted successfully' });
  });
}

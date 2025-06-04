// src/controllers/message.controller.ts

import { Request, Response } from 'express';
import { Service } from 'typedi';
import CustomError from '../utils/customError';
import { MessageService } from '../services/message.service';
import { asyncWrapper } from '../utils/asyncWrapper';

@Service()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * GET /messages/conversation/:conversationId?page=&limit=
   */
  public getConversationById = asyncWrapper(async (req, res) => {
    const userId = req.user.id;
    const conversationId = Number(req.params.conversationId);
    if (isNaN(conversationId)) {
      throw new CustomError('Invalid conversation ID', 400, 'INVALID_ID');
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const { messages } =
      await this.messageService.getConversationByConversationId(
        userId,
        conversationId,
        { page, limit }
      );

    return res.status(200).json({ messages });
  });

  /**
   * GET /messages/:messageId
   */
  getById = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id as number;
    const messageId = Number(req.params.messageId);
    if (isNaN(messageId)) {
      throw new CustomError('Invalid message ID', 400, 'INVALID_MESSAGE_ID');
    }

    const result = await this.messageService.getMessageById(messageId, userId);
    return res.status(200).json({ message: result.message });
  });

  /**
   * POST /messages
   */
  create = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id as number;
    const { conversationId, content, messageType, mediaUrl } = req.body;

    // You may want to validate that conversationId is present & a number:
    if (typeof conversationId !== 'number') {
      throw new CustomError('conversationId required', 400, 'INVALID_PAYLOAD');
    }

    const result = await this.messageService.createMessage({
      fromUserId: userId,
      conversationId,
      content,
      messageType,
      mediaUrl,
    });

    return res.status(201).json({ message: result.message });
  });

  /**
   * PUT /messages/:messageId
   */
  update = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id as number;
    const messageId = Number(req.params.messageId);
    if (isNaN(messageId)) {
      throw new CustomError('Invalid message ID', 400, 'INVALID_MESSAGE_ID');
    }

    const { content, messageType, mediaUrl } = req.body;
    const result = await this.messageService.updateMessage({
      messageId,
      userId,
      content,
      messageType,
      mediaUrl,
    });

    return res.status(200).json({ message: result.message });
  });

  /**
   * DELETE /messages/:messageId
   */
  delete = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id as number;
    const messageId = Number(req.params.messageId);
    if (isNaN(messageId)) {
      throw new CustomError('Invalid message ID', 400, 'INVALID_MESSAGE_ID');
    }

    const result = await this.messageService.deleteMessage(messageId, userId);
    return res
      .status(200)
      .json({ messageId: result.messageId, deletedFor: result.deletedFor });
  });
}

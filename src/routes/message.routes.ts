// src/routes/message.route.ts

import { Router } from 'express';
import { Container } from 'typedi';
import { MessageController } from '../controllers/message.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();
const messageController = Container.get(MessageController);

// GET /api/messages/:messageId
router.get('/:messageId', isAuthenticated, messageController.getById);

// GET /api/messages/conversation/:conversationId
router.get(
  '/conversation/:conversationId',
  isAuthenticated,
  messageController.getConversationById
);

// POST /api/messages
router.post('/', isAuthenticated, messageController.create);

// PUT /api/messages/:messageId
router.put('/:messageId', isAuthenticated, messageController.update);

// DELETE /api/messages/:messageId
router.delete('/:messageId', isAuthenticated, messageController.delete);

export default router;

// src/routes/conversation.routes.ts

import { Router } from 'express';
import { Container } from 'typedi';
import { ConversationController } from '../controllers/conversation.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

const convoController = Container.get(ConversationController);

router.post(
  '/one-on-one/:otherUserId',
  isAuthenticated,
  convoController.getOrCreateOneOnOne
);
// GET /conversations
router.get('/', isAuthenticated, convoController.listConversations);

// POST /conversations
router.post('/', isAuthenticated, convoController.createConversation);

// DELETE /conversations/:id
router.delete('/:id', isAuthenticated, convoController.deleteConversationById);

export default router;

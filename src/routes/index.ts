import { Router } from 'express';
import userRoute from './user.routes';
import profileRoute from './profile.routes';
import favoriteRoute from './favorite.routes';
import availabilityRoutes from './availability.routes';
import sparringRoutes from './sparring.routes';
import notificationRoutes from './notification.routes';
import messagesRoutes from './message.routes';
import conversationRoutes from './conversation.routes';

const router = Router();

router.use('/user', userRoute);
router.use('/profile', profileRoute);
router.use('/favorite', favoriteRoute);
router.use('/availability', availabilityRoutes);
router.use('/sparring', sparringRoutes);
router.use('/notification', notificationRoutes);
router.use('/messages', messagesRoutes);
router.use('/conversations', conversationRoutes);

export default router;

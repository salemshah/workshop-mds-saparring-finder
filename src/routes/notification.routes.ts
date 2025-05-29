import { Router } from 'express';
import { Container } from 'typedi';
import { NotificationController } from '../controllers/notification.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();
const controller = Container.get(NotificationController);

router.use(isAuthenticated);

router.get('/', controller.listAll);
router.get('/:id', controller.getById);
router.delete('/:id', controller.deleteById);

export default router;

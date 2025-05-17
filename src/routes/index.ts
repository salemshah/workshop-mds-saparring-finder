import { Router } from 'express';
import userRoute from './user.routes';
import profileRoute from './profile.routes';

const router = Router();

router.use('/user', userRoute);
router.use('/profile', profileRoute);

export default router;

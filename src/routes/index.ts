import { Router } from 'express';
import userRoute from './user.routes';
import profileRoute from './profile.routes';
import favoriteRoute from './favorite.routes';

const router = Router();

router.use('/user', userRoute);
router.use('/profile', profileRoute);
router.use('/favorite', favoriteRoute);

export default router;

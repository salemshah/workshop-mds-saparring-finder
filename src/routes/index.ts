import { Router } from 'express';
import userRoute from './user.routes';
import profileRoute from './profile.routes';
import favoriteRoute from './favorite.routes';
import availabilityRoutes from './availability.routes';

const router = Router();

router.use('/user', userRoute);
router.use('/profile', profileRoute);
router.use('/favorite', favoriteRoute);
router.use('/availability', availabilityRoutes);

export default router;

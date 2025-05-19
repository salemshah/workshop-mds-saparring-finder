import { Router } from 'express';
import { Container } from 'typedi';
import { FavoriteController } from '../controllers/favorite.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();
const favoriteController = Container.get(FavoriteController);

// Add a favorite
router.post('/toggle', isAuthenticated, favoriteController.toggleFavorite);

// Get all favorites of the authenticated user
router.get('/', isAuthenticated, favoriteController.getFavorites);

// Remove a favorite by favorited user ID
router.delete(
  '/:favoritedUserId',
  isAuthenticated,
  favoriteController.removeFavorite
);

export default router;

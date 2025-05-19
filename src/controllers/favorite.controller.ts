import { Request, Response } from 'express';
import { Service } from 'typedi';
import { FavoriteService } from '../services/favorite.service';
import { asyncWrapper } from '../utils/asyncWrapper';

@Service()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  /**
   * Add a favorite (i.e., mark another user as a favorite).
   * @route POST /favorites
   * @access Private
   */
  toggleFavorite = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    const favorite = await this.favoriteService.toggleFavorite(
      userId,
      targetUserId
    );
    res.status(201).json({ message: 'User added to favorites', favorite });
  });

  /**
   * List all favorites of the authenticated user.
   * @route GET /favorites
   * @access Private
   */
  getFavorites = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const favorites = await this.favoriteService.getFavorites(userId);
    res.status(200).json({ favorites });
  });

  /**
   * Remove a user from favorites.
   * @route DELETE /favorites/:favoritedUserId
   * @access Private
   */
  removeFavorite = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const favoritedUserId = parseInt(req.params.favoritedUserId);

    await this.favoriteService.removeFavorite(userId, favoritedUserId);
    res.status(200).json({ message: 'Favorite removed successfully' });
  });
}

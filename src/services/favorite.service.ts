import { Service } from 'typedi';
import prisma from '../prisma/client';
import { Favorite } from '@prisma/client';
import CustomError from '../utils/customError';

@Service()
export class FavoriteService {
  /**
   * Add a user to favorites
   */
  async toggleFavorite(
    userId: number,
    targetUserId: number
  ): Promise<{ action: 'added' | 'removed'; favorite?: Favorite }> {
    const existing = await prisma.favorite.findFirst({
      where: {
        user_id: userId,
        favorited_user_id: targetUserId,
      },
    });

    if (existing) {
      // If already favorited, remove it (unfavorite)
      await prisma.favorite.delete({
        where: {
          id: existing.id,
        },
      });

      return { action: 'removed' };
    } else {
      // Otherwise, create the favorite
      const favorite = await prisma.favorite.create({
        data: {
          user_id: userId,
          favorited_user_id: targetUserId,
        },
      });

      return { action: 'added', favorite };
    }
  }

  /**
   * Remove a favorite
   */
  async removeFavorite(userId: number, favoritedUserId: number): Promise<void> {
    const favorite = await prisma.favorite.findFirst({
      where: {
        user_id: userId,
        favorited_user_id: favoritedUserId,
      },
    });

    if (!favorite) {
      throw new CustomError('Favorite not found', 404, 'FAVORITE_NOT_FOUND');
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });
  }

  /**
   * Get all favorites of a user
   */
  async getFavorites(userId: number): Promise<Favorite[]> {
    return prisma.favorite.findMany({
      where: { user_id: userId },
      include: {
        favorited_user: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Check if a specific user is favorited by another user
   */
  async isFavorited(userId: number, favoritedUserId: number): Promise<boolean> {
    const favorite = await prisma.favorite.findFirst({
      where: {
        user_id: userId,
        favorited_user_id: favoritedUserId,
      },
    });

    return !!favorite;
  }
}

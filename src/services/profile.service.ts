import { Service } from 'typedi';
import prisma from '../prisma/client';
import { Prisma, Profile } from '@prisma/client';
import CustomError from '../utils/customError';

/** Structure returned by every list/search/filter call so the mobile app
 *  always receives a `profiles` array (even for a single profile).
 */
export interface ProfilesResponse {
  profiles: ProfileWithFavorites[];
}

export type ProfileWithFavorites = Profile & {
  user: {
    favorites: {
      favorited_user_id: number;
      user_id: number;
    }[];
  };
};

const userFavoritesInclude = {
  user: {
    select: {
      favorites: {
        select: {
          favorited_user_id: true,
          user_id: true,
        },
      },
    },
  },
} satisfies Prisma.ProfileInclude;

@Service()
export class ProfileService {
  /** --------------------------- Create ---------------------------------- */
  async createProfile(
    userId: number,
    profileData: Omit<Prisma.ProfileCreateInput, 'user'> & {
      date_of_birth: string | Date;
    }
  ): Promise<ProfilesResponse> {
    const existing = await prisma.profile.findUnique({
      where: { user_id: userId },
    });
    if (existing) {
      throw new CustomError('Profile already exists', 409, 'PROFILE_EXISTS');
    }

    // Destructure latitude, longitude, and date_of_birth so we can convert them.
    const { latitude, longitude, date_of_birth, ...rest } = profileData;

    await prisma.profile.create({
      data: {
        ...rest,
        date_of_birth: new Date(date_of_birth),
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        user: { connect: { id: userId } },
      },
    });

    const createdProfile = await prisma.profile.findUnique({
      where: { user_id: userId },
      include: userFavoritesInclude,
    });

    return {
      profiles: createdProfile ? [createdProfile as ProfileWithFavorites] : [],
    };
  }

  /** --------------------------- Update ---------------------------------- */
  async updateProfile(
    userId: number,
    updateData: Partial<Prisma.ProfileUpdateInput> & {
      date_of_birth?: string | Date;
    }
  ): Promise<ProfilesResponse> {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });
    if (!profile) {
      throw new CustomError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // Destructure latitude, longitude, and date_of_birth so we can convert them.
    const { latitude, longitude, date_of_birth, ...restUpdate } = updateData;

    await prisma.profile.update({
      where: { user_id: userId },
      data: {
        ...restUpdate,
        ...(date_of_birth && {
          date_of_birth: new Date(date_of_birth),
        }),
        ...(latitude != null && {
          latitude: parseFloat(String(latitude)),
        }),
        ...(longitude != null && {
          longitude: parseFloat(String(longitude)),
        }),
      },
    });

    const updated = await prisma.profile.findUnique({
      where: { user_id: userId },
      include: userFavoritesInclude,
    });

    return {
      profiles: updated ? [updated as ProfileWithFavorites] : [],
    };
  }

  /** --------------------------- Get / Delete ---------------------------- */
  async getProfileByUserId(userId: number): Promise<ProfilesResponse> {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      include: userFavoritesInclude,
    });
    return {
      profiles: profile ? [profile as ProfileWithFavorites] : [],
    };
  }

  async deleteProfile(userId: number): Promise<void> {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });
    if (!profile) {
      throw new CustomError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    await prisma.profile.delete({ where: { user_id: userId } });
  }

  async hasProfile(userId: number): Promise<boolean> {
    return !!(await prisma.profile.findUnique({ where: { user_id: userId } }));
  }

  async updateProfilePhoto(
    userId: number,
    photoUrl: string
  ): Promise<ProfilesResponse> {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });
    if (!profile) {
      throw new CustomError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    await prisma.profile.update({
      where: { user_id: userId },
      data: { photo_url: photoUrl },
    });
    const updated = await prisma.profile.findUnique({
      where: { user_id: userId },
      include: userFavoritesInclude,
    });
    return {
      profiles: updated ? [updated as ProfileWithFavorites] : [],
    };
  }

  /** --------------------------- Lists ----------------------------------- */
  async listProfiles(): Promise<ProfilesResponse> {
    const profiles = await prisma.profile.findMany({
      orderBy: { created_at: 'desc' },
      include: userFavoritesInclude,
    });
    return { profiles: profiles as ProfileWithFavorites[] };
  }

  /** --------------------------- Search ---------------------------------- */
  async searchProfiles(query: string): Promise<ProfilesResponse> {
    const terms = query.trim().split(' ').filter(Boolean);

    const where: Prisma.ProfileWhereInput = {
      OR: [
        {
          AND: terms.map((t) => ({
            first_name: { contains: t, mode: 'insensitive' },
          })),
        },
        {
          AND: terms.map((t) => ({
            last_name: { contains: t, mode: 'insensitive' },
          })),
        },
        {
          AND: terms.map((t) => ({
            city: { contains: t, mode: 'insensitive' },
          })),
        },
        {
          AND: terms.map((t) => ({
            skill_level: { contains: t, mode: 'insensitive' },
          })),
        },
        {
          AND: terms.map((t) => ({
            preferred_styles: { contains: t, mode: 'insensitive' },
          })),
        },
        // Full-name (first + last)
        {
          AND: [
            {
              first_name: {
                contains: terms[0] ?? '',
                mode: 'insensitive',
              },
            },
            {
              last_name: {
                contains: terms[1] ?? '',
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };

    const results = await prisma.profile.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: userFavoritesInclude,
    });
    return { profiles: results as ProfileWithFavorites[] };
  }

  /** --------------------------- Filter ---------------------------------- */
  async filterProfiles(filters: {
    level?: string;
    country?: string;
    city?: string;
    gender?: string;
    maxWeight?: number;
    minWeight?: number;
  }): Promise<ProfilesResponse> {
    const where: Prisma.ProfileWhereInput = {};

    if (filters.level) where.skill_level = filters.level;
    if (filters.country) where.country = filters.country;
    if (filters.city) where.city = filters.city;
    if (filters.gender) where.gender = filters.gender;

    const interim = await prisma.profile.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: userFavoritesInclude,
    });

    const filtered = interim.filter((p) => {
      const weight = parseInt(p.weight_class, 10);
      if (Number.isNaN(weight)) return false;
      const passMin = filters.minWeight
        ? weight >= (filters.minWeight as number)
        : true;
      const passMax = filters.maxWeight
        ? weight <= (filters.maxWeight as number)
        : true;
      return passMin && passMax;
    });

    return { profiles: filtered as ProfileWithFavorites[] };
  }
}

import { Service } from 'typedi';
import prisma from '../prisma/client';
import { Prisma, Profile } from '@prisma/client';
import CustomError from '../utils/customError';

@Service()
export class ProfileService {
  /**
   * Creates a new profile for a user.
   * @param userId - ID of the user.
   * @param profileData - Profile data excluding user relation.
   * @returns The newly created profile.
   */
  async createProfile(
    userId: number,
    profileData: Omit<Prisma.ProfileCreateInput, 'user'> & {
      date_of_birth: string | Date;
    }
  ): Promise<Profile> {
    const existingProfile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });

    if (existingProfile) {
      throw new CustomError('Profile already exists', 409, 'PROFILE_EXISTS');
    }

    return prisma.profile.create({
      data: {
        ...profileData,
        date_of_birth: new Date(profileData.date_of_birth),
        user: { connect: { id: userId } },
      },
    });
  }

  /**
   * Updates an existing user profile.
   * @param userId - ID of the user.
   * @param updateData - Profile fields to update.
   * @returns The updated profile.
   */
  async updateProfile(
    userId: number,
    updateData: Partial<Prisma.ProfileUpdateInput> & {
      date_of_birth?: string | Date;
    }
  ): Promise<Profile> {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new CustomError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    return prisma.profile.update({
      where: { user_id: userId },
      data: {
        ...updateData,
        ...(updateData.date_of_birth && {
          date_of_birth: new Date(updateData.date_of_birth),
        }),
      },
    });
  }

  /**
   * Retrieves a user's profile by their ID.
   * @param userId - ID of the user.
   * @returns The user's profile.
   */
  async getProfileByUserId(userId: number): Promise<Profile | null> {
    return prisma.profile.findUnique({ where: { user_id: userId } });
  }

  /**
   * Deletes a user's profile.
   * @param userId - ID of the user.
   * @returns Confirmation of deletion.
   */
  async deleteProfile(userId: number): Promise<void> {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new CustomError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    await prisma.profile.delete({ where: { user_id: userId } });
  }

  /**
   * Checks if a profile exists for a given user ID.
   * @param userId - ID of the user.
   * @returns Boolean indicating existence.
   */
  async hasProfile(userId: number): Promise<boolean> {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
    });
    return !!profile;
  }

  /**
   * Lists all profiles (for admin or dashboard usage).
   * @returns List of profiles.
   */
  async listProfiles(): Promise<Profile[]> {
    return prisma.profile.findMany({ orderBy: { created_at: 'desc' } });
  }

  /**
   * Retrieves a profile by profile ID.
   * @param id - Profile ID.
   * @returns Profile or null.
   */
  async getProfileById(id: number): Promise<Profile | null> {
    return prisma.profile.findUnique({ where: { id } });
  }
}

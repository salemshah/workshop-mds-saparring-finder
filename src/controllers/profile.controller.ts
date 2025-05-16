import { Request, Response } from 'express';
import { Service } from 'typedi';
import { ProfileService } from '../services/profile.service';
import { asyncWrapper } from '../utils/asyncWrapper';

@Service()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Retrieves the profile of the authenticated user.
   * @route GET /user/profile
   * @access Private
   */
  getProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const profile = await this.profileService.getProfileByUserId(userId);
    res.status(200).json({ profile });
  });

  /**
   * Creates a profile for the authenticated user.
   * @route POST /user/profile
   * @access Private
   */
  createProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const profileData = req.body;
    const profile = await this.profileService.createProfile(userId, profileData);
    res.status(201).json({ message: 'Profile created successfully', profile });
  });

  /**
   * Updates the profile of the authenticated user.
   * @route PUT /user/profile
   * @access Private
   */
  updateProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const updateData = req.body;
    const profile = await this.profileService.updateProfile(userId, updateData);
    res.status(200).json({ message: 'Profile updated successfully', profile });
  });

  /**
   * Deletes the profile of the authenticated user.
   * @route DELETE /user/profile
   * @access Private
   */
  deleteProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    await this.profileService.deleteProfile(userId);
    res.status(200).json({ message: 'Profile deleted successfully' });
  });

  /**
   * Lists all profiles (admin usage).
   * @route GET /admin/profiles
   * @access Admin
   */
  listProfiles = asyncWrapper(async (_req: Request, res: Response) => {
    const profiles = await this.profileService.listProfiles();
    res.status(200).json({ profiles });
  });

  /**
   * Retrieves a profile by its ID.
   * @route GET /admin/profiles/:id
   * @access Admin
   */
  getProfileById = asyncWrapper(async (req: Request, res: Response) => {
    const profileId = parseInt(req.params.id, 10);
    const profile = await this.profileService.getProfileById(profileId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  });
}

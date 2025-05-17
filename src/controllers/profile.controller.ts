import { Request, Response } from 'express';
import { Service } from 'typedi';
import { ProfileService } from '../services/profile.service';
import { asyncWrapper } from '../utils/asyncWrapper';
import { uploadImageToCloudinary } from '../utils/cloudinary';

@Service()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Retrieves the profile of the authenticated user.
   * @route GET /profile
   * @access Private
   */
  getProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const profile = await this.profileService.getProfileByUserId(userId);
    res.status(200).json({ profile });
  });

  /**
   * Creates a profile for the authenticated user.
   * @route POST /profile
   * @access Private
   */
  createProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const profileData = req.body;

    // Handle image upload if file is present
    if (req.file?.buffer) {
      const photoUrl = await uploadImageToCloudinary(req.file.buffer);
      profileData.photo_url = photoUrl;
    }

    const profile = await this.profileService.createProfile(
      userId,
      profileData
    );
    res.status(201).json({ message: 'Profile created successfully', profile });
  });

  /**
   * Updates the profile of the authenticated user.
   * @route PUT /profile
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
   * @route DELETE /profile
   * @access Private
   */
  deleteProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    await this.profileService.deleteProfile(userId);
    res.status(200).json({ message: 'Profile deleted successfully' });
  });

  /**
   * Lists all profiles the authenticated user.
   * @route GET /profile/all
   * @access private
   */
  listProfiles = asyncWrapper(async (_req: Request, res: Response) => {
    const profiles = await this.profileService.listProfiles();
    res.status(200).json({ profiles });
  });

  /**
   * Checks if the authenticated user has a profile.
   * @route GET /profile/exists
   * @access Private
   */
  hasProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const exists = await this.profileService.hasProfile(userId);

    res.status(200).json({ hasProfile: exists });
  });

  /**
   * Updates the profile photo of the authenticated user.
   * @route PATCH /profile/photo
   * @access Private
   */
  updateProfilePhoto = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;

    if (!req.file?.buffer) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const photoUrl = await uploadImageToCloudinary(req.file.buffer);
    const profile = await this.profileService.updateProfilePhoto(
      userId,
      photoUrl
    );

    res
      .status(200)
      .json({ message: 'Profile photo updated successfully', profile });
  });
}

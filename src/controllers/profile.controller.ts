import { Request, Response } from 'express';
import { Service } from 'typedi';

import { ProfileService, ProfilesResponse } from '../services/profile.service';
import { asyncWrapper } from '../utils/asyncWrapper';
import { uploadImageToCloudinary } from '../utils/cloudinary';

/**
 * Express controller – maps HTTP routes to ProfileService methods and ensures
 * **every** successful response that the mobile app consumes contains a
 * top-level `profiles` array. (If a message is needed it’s merged alongside.)
 */
@Service()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // -------------------------------------------------------------------------
  // GET /profile – fetch authenticated user profile
  // -------------------------------------------------------------------------
  getProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result: ProfilesResponse =
      await this.profileService.getProfileByUserId(userId);
    res.status(200).json(result);
  });

  // -------------------------------------------------------------------------
  // POST /profile – create profile
  // -------------------------------------------------------------------------
  createProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const data = { ...req.body };

    if (req.file?.buffer) {
      data.photo_url = await uploadImageToCloudinary(req.file.buffer);
    }

    const result: ProfilesResponse = await this.profileService.createProfile(
      userId,
      data
    );
    res
      .status(201)
      .json({ message: 'Profile created successfully', ...result });
  });

  // -------------------------------------------------------------------------
  // PUT /profile – update profile
  // -------------------------------------------------------------------------
  updateProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result: ProfilesResponse = await this.profileService.updateProfile(
      userId,
      req.body
    );
    res
      .status(200)
      .json({ message: 'Profile updated successfully', ...result });
  });

  // -------------------------------------------------------------------------
  // DELETE /profile – delete profile
  // -------------------------------------------------------------------------
  deleteProfile = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    await this.profileService.deleteProfile(userId);
    res.status(200).json({ message: 'Profile deleted successfully' });
  });

  // -------------------------------------------------------------------------
  // GET /profile/all – list every profile
  // -------------------------------------------------------------------------
  listProfiles = asyncWrapper(async (_req: Request, res: Response) => {
    const result: ProfilesResponse = await this.profileService.listProfiles();
    res.status(200).json(result);
  });

  // -------------------------------------------------------------------------
  // GET /profile/exists – does auth user have profile?
  // -------------------------------------------------------------------------
  hasProfile = asyncWrapper(async (req: Request, res: Response) => {
    const exists = await this.profileService.hasProfile(req.user.id);
    res.status(200).json({ hasProfile: exists });
  });

  // -------------------------------------------------------------------------
  // PATCH /profile/photo – update profile image
  // -------------------------------------------------------------------------
  updateProfilePhoto = asyncWrapper(async (req: Request, res: Response) => {
    if (!req.file?.buffer) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const userId = req.user.id;
    const photoUrl = await uploadImageToCloudinary(req.file.buffer);
    const result: ProfilesResponse =
      await this.profileService.updateProfilePhoto(userId, photoUrl);

    res
      .status(200)
      .json({ message: 'Profile photo updated successfully', ...result });
  });

  // -------------------------------------------------------------------------
  // GET /profile/search?q=… – free-text search
  // -------------------------------------------------------------------------
  searchProfiles = asyncWrapper(async (req: Request, res: Response) => {
    const query = (req.query.q as string)?.trim();
    if (!query)
      return res.status(400).json({ message: 'Search query is too short' });

    const result: ProfilesResponse =
      await this.profileService.searchProfiles(query);
    res.status(200).json(result);
  });

  // -------------------------------------------------------------------------
  // GET /profile/filter – filter via query params
  // -------------------------------------------------------------------------
  filterProfiles = asyncWrapper(async (req: Request, res: Response) => {
    const result: ProfilesResponse = await this.profileService.filterProfiles({
      level: req.query.level as string,
      country: req.query.country as string,
      city: req.query.city as string,
      gender: req.query.gender as string,
      maxWeight: req.query.maxWeight ? Number(req.query.maxWeight) : undefined,
      minWeight: req.query.minWeight ? Number(req.query.minWeight) : undefined,
    });
    res.status(200).json(result);
  });
}

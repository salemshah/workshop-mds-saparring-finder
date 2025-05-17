import { Router } from 'express';
import { Container } from 'typedi';
import { ProfileController } from '../controllers/profile.controller';
import { validate } from '../middlewares/validation.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';
import multer from 'multer';
const upload = multer();

import {
  createProfileSchema,
  updateProfileSchema,
} from '../validators/profile.validation';

const router = Router();
const profileController = Container.get(ProfileController);

// Current user's profile
router.get('/', isAuthenticated, profileController.getProfile);
router.get('/all', isAuthenticated, profileController.listProfiles);
router.post(
  '/',
  isAuthenticated,
  upload.single('photo'),
  validate(createProfileSchema),
  profileController.createProfile
);
router.put(
  '/',
  isAuthenticated,
  validate(updateProfileSchema),
  profileController.updateProfile
);
router.delete('/', isAuthenticated, profileController.deleteProfile);
router.get('/exists', isAuthenticated, profileController.hasProfile);

// Update profile photo
router.patch(
  '/photo',
  isAuthenticated,
  upload.single('photo'),
  profileController.updateProfilePhoto
);

export default router;

import { Router } from 'express';
import { Container } from 'typedi';
import { AvailabilityController } from '../controllers/availability.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from '../validators/availability.validation';

const router = Router();
const availabilityController = Container.get(AvailabilityController);

// GET all for current user
router.get('/', isAuthenticated, availabilityController.getAll);

router.get(
  '/all/:targetUserId',
  isAuthenticated,
  availabilityController.getAllTargetUserId
);

// GET by ID
router.get('/:id', isAuthenticated, availabilityController.getById);

// CREATE
router.post(
  '/',
  isAuthenticated,
  validate(createAvailabilitySchema),
  availabilityController.create
);

// UPDATE
router.put(
  '/:id',
  isAuthenticated,
  validate(updateAvailabilitySchema),
  availabilityController.update
);

// DELETE
router.delete('/:id', isAuthenticated, availabilityController.delete);

export default router;

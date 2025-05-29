import { Router } from 'express';
import { Container } from 'typedi';
import { SparringController } from '../controllers/sparring.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  createSparringSchema,
  updateSparringSchema,
  cancelSparringSchema,
} from '../validators/sparring.validation';

const router = Router();
const sparringController = Container.get(SparringController);

// GET all sparrings of current user (both requester and partner)
router.get('/', isAuthenticated, sparringController.getAll);

// GET all sparrings of user id and its partner
router.get(
  '/all/:partnerId',
  isAuthenticated,
  sparringController.getAllByRequestIdAndPartnerId
);

// GET sparring by ID
router.get('/:id', isAuthenticated, sparringController.getById);

// CREATE sparring
router.post(
  '/',
  isAuthenticated,
  validate(createSparringSchema),
  sparringController.create
);

// UPDATE sparring (only by requester and only if status is pending)
router.put(
  '/:id',
  isAuthenticated,
  validate(updateSparringSchema),
  sparringController.update
);

// CONFIRM sparring (only by partner)
router.post('/:id/confirm', isAuthenticated, sparringController.confirm);

// CANCEL sparring (by either user)
router.post(
  '/:id/cancel',
  isAuthenticated,
  validate(cancelSparringSchema),
  sparringController.cancel
);

export default router;

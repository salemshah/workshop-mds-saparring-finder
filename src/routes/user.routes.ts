import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validation.middleware';
import { Container } from 'typedi';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/user.validation';

const userController = Container.get(UserController);
const router = Router();

// Public routes
router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.post('/verify-email', validate(verifyEmailSchema), userController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), userController.resendVerification);
router.post('/forgot-password', validate(forgotPasswordSchema), userController.forgotPassword);
router.put('/reset-password', validate(resetPasswordSchema), userController.resetPassword);

export default router;

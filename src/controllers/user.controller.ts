import { Request, Response } from 'express';
import { Service } from 'typedi';
import { UserService } from '../services/user.service';
import { asyncWrapper } from '../utils/asyncWrapper';
import { setTokenCookie } from '../utils/setCookie';

@Service()
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Registers a new user.
   * @route POST /user/register
   * @access Public
   */
  register = asyncWrapper(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await this.userService.registerUser(email, password);
    res.status(201).json({ message: 'Registration successful', user });
  });

  /**
   * Logs in a user.
   * @route POST /user/login
   * @access Public
   */
  login = asyncWrapper(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await this.userService.loginUser(email, password);
    setTokenCookie(res, result.accessToken);
    res.status(200).json(result);
  });

  /**
   * Verifies a user's email.
   * @route POST /user/verify-email
   * @access Public
   */
  verifyEmail = asyncWrapper(async (req: Request, res: Response) => {
    const { code } = req.body;
    const result = await this.userService.verifyEmail(code);
    res.status(200).json(result);
  });

  /**
   * Resends the verification email.
   * @route POST /user/resend-verification
   * @access Public
   */
  resendVerification = asyncWrapper(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await this.userService.resendVerification(email);
    res.status(200).json(result);
  });

  /**
   * Sends password reset code to user's email.
   * @route POST /user/forgot-password
   * @access Public
   */
  forgotPassword = asyncWrapper(async (req: Request, res: Response) => {
    const { email } = req.body;
    await this.userService.forgotPassword(email);
    res.status(200).json({ message: `Password reset code sent to ${email}` });
  });

  /**
   * Resets the user's password.
   * @route PUT /user/reset-password
   * @access Public
   */
  resetPassword = asyncWrapper(async (req: Request, res: Response) => {
    const { code, newPassword } = req.body;
    await this.userService.resetPassword(code, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  });

  /**
   * Save token as soon as the user is logged in app.
   * @route PUT /user/save-token
   * @access Private
   */
  saveFcmToken = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { fcm_token } = req.body;
    const result = await this.userService.saveFcmToken(userId, fcm_token);
    res.status(200).json(result);
  });
}

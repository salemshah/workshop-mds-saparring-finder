import { Service } from 'typedi';
import prisma from '../prisma/client';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import CustomError from '../utils/customError';
import { sendEmail } from '../utils/sendEmail';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { excludeField } from '../utils/helper-functions';
import { NotificationService } from './notification.service';

export type SafeUser = Omit<
  User,
  | 'password_hash'
  | 'verification_code'
  | 'verification_code_expires'
  | 'reset_password_code'
  | 'reset_password_code_expires'
>;
export type AuthUserResponse = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
};

@Service()
export class UserService {
  constructor(private readonly notificationService: NotificationService) {}

  async registerUser(email: string, password: string): Promise<SafeUser> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      throw new CustomError('Email already in use', 409, 'EMAIL_IN_USE');

    const password_hash = await bcrypt.hash(password, 10); // ✅ Works the same
    const verification_code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verification_code_expires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `<h1>Welcome!</h1><p>Use the code below to verify your email:</p><h2>${verification_code}</h2>`,
    });

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: 'user',
        is_verified: false,
        is_active: true,
        auth_provider: 'email',
        verification_code,
        verification_code_expires,
      },
    });

    return this.getSafeUser(user);
  }

  async loginUser(email: string, password: string): Promise<AuthUserResponse> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new CustomError(
        'Invalid email or password',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    if (!user.is_verified)
      throw new CustomError('Email not verified', 403, 'EMAIL_NOT_VERIFIED');
    if (!user.is_active)
      throw new CustomError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');

    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });
    return { user: this.getSafeUser(user), accessToken, refreshToken };
  }

  async verifyEmail(code: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: { verification_code: code },
    });
    if (!user || user.verification_code_expires! < new Date()) {
      throw new CustomError('Invalid or expired code', 400, 'INVALID_CODE');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verification_code: null,
        verification_code_expires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    if (user.is_verified)
      throw new CustomError('Already verified', 400, 'ALREADY_VERIFIED');

    const verification_code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verification_code_expires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { verification_code, verification_code_expires },
    });

    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `<p>Use the code below to verify your email:</p><h2>${verification_code}</h2>`,
    });

    return { message: 'Verification code resent' };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new CustomError('User not found', 404, 'USER_NOT_FOUND');

    const reset_password_code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const reset_password_code_expires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_password_code, reset_password_code_expires },
    });

    await sendEmail({
      to: email,
      subject: 'Password Reset',
      html: `<p>Use this code to reset your password:</p><h2>${reset_password_code}</h2>`,
    });
  }

  async resetPassword(code: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        reset_password_code: code,
        reset_password_code_expires: { gt: new Date() },
      },
    });
    if (!user)
      throw new CustomError(
        'Invalid or expired code',
        400,
        'INVALID_RESET_CODE'
      );

    const password_hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        reset_password_code: null,
        reset_password_code_expires: null,
      },
    });
  }

  getSafeUser(user: User): SafeUser {
    return excludeField(user, [
      'password_hash',
      'verification_code',
      'verification_code_expires',
      'reset_password_code',
      'reset_password_code_expires',
    ]);
  }

  async saveFcmToken(
    userId: number,
    token: string
  ): Promise<{ message: string }> {
    if (!token) {
      throw new CustomError('Missing FCM token', 400, 'MISSING_FCM_TOKEN');
    }

    console.log('new token rrrrr ==> ', { token });
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });

    return { message: 'FCM token saved successfully' };
  }
}

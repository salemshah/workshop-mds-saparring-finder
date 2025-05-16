import { User } from '@prisma/client';

export interface TokenPayload {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export type SafeParent = Omit<
  User,
  | 'password'
  | 'verificationCode'
  | 'verificationCodeExpires'
  | 'resetPasswordCode'
  | 'resetPasswordCodeExpires'
>;

export type AuthParentResponse = {
  user: SafeParent;
  accessToken: string;
  refreshToken: string;
};

import { Response } from 'express';

export const setTokenCookie = (res: Response, token: string) => {
  res.cookie('accessToken', token, {
    httpOnly: true, // prevents JavaScript access
    secure: process.env.NODE_ENV === 'production', // ensures HTTPS in prod
    sameSite: 'lax', // CSRF protection
    maxAge: 1000 * 60 * 60 * 8, // 15 minutes
    path: '/',
  });
};

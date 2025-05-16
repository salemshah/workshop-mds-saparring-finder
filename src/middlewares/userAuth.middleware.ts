import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '@prisma/client';
import logger from '../utils/logger';

export const userAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string = '';
  if (req?.cookies?.accessToken) {
    token = req.cookies.accessToken as string;
  } else if (
    req?.headers?.authorization &&
    req?.headers?.authorization?.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1] as string;

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  try {
    req.user = verifyAccessToken(token) as User;
    next();
  } catch (err) {
    logger.error(err);
    return res.status(401).json({ message: `Invalid or expired access token` });
  }
};

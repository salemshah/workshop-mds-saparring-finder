import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import config from '../config';

const accessTokenSecret = config.jwt.accessTokenSecret!;
const refreshTokenSecret = config.jwt.refreshTokenSecret!;
const accessTokenExpiresIn = config.jwt.accessTokenExpiresIn!;
const refreshTokenExpiresIn = config.jwt.refreshTokenExpiresIn!;

if (!accessTokenSecret || !refreshTokenSecret) {
  throw new Error('JWT secrets are not defined in config');
}

// Generate Access Token
export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, accessTokenSecret, {
    expiresIn: accessTokenExpiresIn,
  } as SignOptions);
};

// Generate Refresh Token
export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, refreshTokenSecret, {
    expiresIn: refreshTokenExpiresIn,
  } as SignOptions);
};

// Verify Access Token
export const verifyAccessToken = (token: string): JwtPayload | string => {
  return jwt.verify(token, accessTokenSecret);
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): JwtPayload | string => {
  return jwt.verify(token, refreshTokenSecret);
};

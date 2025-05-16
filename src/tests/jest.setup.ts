import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import initializeApp from '../app';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { Application } from 'express';

dotenv.config({ path: '.env.test' });

jest.mock('../utils/sendEmail', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const prisma = new PrismaClient();

const resetDatabase = () => {
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to push Prisma schema:', error);
  }
};

let app: Application;

beforeAll(async () => {
  resetDatabase();
  await prisma.$connect();
  await prisma.user.deleteMany(); // Clear users
  app = await initializeApp();
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(() => {
  jest.clearAllMocks();
});

export { app };

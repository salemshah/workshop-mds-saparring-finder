import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import initializeApp from '../app';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { Application } from 'express';

// Increase Jest timeout for all tests
jest.setTimeout(30000);

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

jest.mock('../utils/cloudinary', () => ({
  uploadImageToCloudinary: jest
    .fn()
    .mockResolvedValue('https://mock-cloudinary-url.com/test.jpg'),
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
  try {
    resetDatabase();
    await prisma.$connect();

    // Clean up in the correct order to respect foreign key constraints
    await prisma.sparring.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();

    app = await initializeApp();
    console.log('Test setup completed successfully');
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
}, 30000); // Increase timeout to 30 seconds for this specific hook

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(() => {
  jest.clearAllMocks();
});

export { app };

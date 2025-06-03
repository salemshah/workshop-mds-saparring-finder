import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../jest.setup';

const prisma = new PrismaClient();

describe('User Public Routes', () => {
  const userData = {
    email: 'user@example.com',
    password: 'StrongPass123',
  };

  beforeAll(async () => {
    // Clean up in the correct order to respect foreign key constraints
    await prisma.sparring.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    // Clean up in the correct order to respect foreign key constraints
    await prisma.sparring.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/user/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/user/register').send(userData);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject duplicate email registration', async () => {
      await request(app).post('/api/user/register').send(userData);
      const res = await request(app).post('/api/user/register').send(userData);
      expect(res.statusCode).toBe(409);
    });

    it('should fail for invalid data', async () => {
      const res = await request(app).post('/api/user/register').send({
        email: 'invalid',
        password: '123',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/user/verify-email', () => {
    it('should verify email with correct code', async () => {
      await request(app).post('/api/user/register').send(userData);
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      const res = await request(app)
        .post('/api/user/verify-email')
        .send({ code: user?.verification_code });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/user/resend-verification', () => {
    it('should resend verification code', async () => {
      await request(app).post('/api/user/register').send(userData);
      const res = await request(app)
        .post('/api/user/resend-verification')
        .send({ email: userData.email });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/user/forgot-password', () => {
    it('should send password reset code', async () => {
      await request(app).post('/api/user/register').send(userData);
      await prisma.user.update({
        where: { email: userData.email },
        data: { is_verified: true },
      });
      const res = await request(app)
        .post('/api/user/forgot-password')
        .send({ email: userData.email });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/user/reset-password', () => {
    it('should reset password with valid code', async () => {
      await request(app).post('/api/user/register').send(userData);
      await prisma.user.update({
        where: { email: userData.email },
        data: { is_verified: true },
      });
      await request(app)
        .post('/api/user/forgot-password')
        .send({ email: userData.email });
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      const res = await request(app)
        .put('/api/user/reset-password')
        .send({ code: user?.reset_password_code, newPassword: 'NewPass456' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/user/register').send(userData);
      await prisma.user.update({
        where: { email: userData.email },
        data: { is_verified: true, is_active: true },
      });
    });

    it('should login successfully', async () => {
      const res = await request(app).post('/api/user/login').send(userData);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should fail login with wrong credentials', async () => {
      const res = await request(app).post('/api/user/login').send({
        email: userData.email,
        password: 'wrongpass',
      });
      expect(res.statusCode).toBe(401);
    });
  });
});

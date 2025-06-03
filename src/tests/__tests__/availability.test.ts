import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../jest.setup';
import { generateAccessToken } from '../../utils/jwt';

const prisma = new PrismaClient();

describe('Availability Routes', () => {
  // Test user data
  const userData = {
    email: 'availability-test@example.com',
    password: 'StrongPass123',
  };

  // Test profile data
  const profileData = {
    first_name: 'John',
    last_name: 'Doe',
    bio: 'Test bio',
    date_of_birth: '1990-01-01T00:00:00.000Z',
    gender: 'Male',
    weight_class: '75',
    skill_level: 'Intermediate',
    years_experience: '5',
    preferred_styles: 'Boxing, MMA',
    gym_name: 'Test Gym',
    city: 'Test City',
    country: 'Test Country',
    address: 'Test Address, 123',
    latitude: '40.7128',
    longitude: '-74.0060',
  };

  // Test availability data
  const availabilityData = {
    specific_date: '2025-07-01T00:00:00.000Z',
    start_time: '2025-07-01T14:00:00.000Z',
    end_time: '2025-07-01T16:00:00.000Z',
    location: 'Test Gym',
  };

  // Updated availability data
  const updatedAvailabilityData = {
    specific_date: '2025-07-02T00:00:00.000Z',
    start_time: '2025-07-02T15:00:00.000Z',
    end_time: '2025-07-02T17:00:00.000Z',
    location: 'Updated Gym',
  };

  let userId: number;
  let accessToken: string;

  // Helper function to create a user and get token
  const createUserAndGetToken = async () => {
    // Register a user
    await request(app).post('/api/user/register').send(userData);

    // Verify and activate the user
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    userId = user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: { is_verified: true, is_active: true },
    });

    // Generate token
    accessToken = generateAccessToken({
      id: userId,
      email: userData.email,
      role: 'user',
    });

    // Create profile
    await request(app)
      .post('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(profileData);

    return { userId, accessToken };
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

  afterAll(async () => {
    // Clean up in the correct order to respect foreign key constraints
    await prisma.sparring.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    // Clean up in the correct order to respect foreign key constraints
    await prisma.sparring.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
    await createUserAndGetToken();
  });

  describe('POST /api/availability', () => {
    it('should create an availability successfully', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        'message',
        'Availability created successfully'
      );
      expect(res.body).toHaveProperty('availabilities');
      expect(res.body.availabilities).toBeInstanceOf(Array);
      expect(res.body.availabilities.length).toBeGreaterThan(0);
      expect(res.body.availabilities[0]).toHaveProperty('user_id', userId);
      expect(res.body.availabilities[0]).toHaveProperty(
        'location',
        availabilityData.location
      );
    });

    it('should reject availability creation with invalid data', async () => {
      const invalidData = {
        ...availabilityData,
        start_time: 'invalid-date', // Invalid date format
      };

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData);

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthenticated availability creation', async () => {
      const res = await request(app)
        .post('/api/availability')
        .send(availabilityData);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/availability', () => {
    it('should get all availabilities for authenticated user', async () => {
      // Create an availability first
      await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      // Create another availability
      await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...availabilityData,
          specific_date: '2025-07-02T00:00:00.000Z',
        });

      // Get all availabilities
      const res = await request(app)
        .get('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('availabilities');
      expect(res.body.availabilities).toBeInstanceOf(Array);
      expect(res.body.availabilities.length).toBe(2);
      expect(res.body.availabilities[0]).toHaveProperty('user_id', userId);
      expect(res.body.availabilities[1]).toHaveProperty('user_id', userId);
    });

    it('should return empty array if no availabilities exist', async () => {
      const res = await request(app)
        .get('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('availabilities');
      expect(res.body.availabilities).toBeInstanceOf(Array);
      expect(res.body.availabilities.length).toBe(0);
    });

    it('should reject unauthenticated availability retrieval', async () => {
      const res = await request(app).get('/api/availability');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/availability/:id', () => {
    it('should get availability by ID', async () => {
      // Create an availability first
      const createRes = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      const availabilityId = createRes.body.availabilities[0].id;

      // Get availability by ID
      const res = await request(app)
        .get(`/api/availability/${availabilityId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('availabilities');
      expect(res.body.availabilities).toBeInstanceOf(Array);
      expect(res.body.availabilities.length).toBe(1);
      expect(res.body.availabilities[0]).toHaveProperty('id', availabilityId);
      expect(res.body.availabilities[0]).toHaveProperty('user_id', userId);
      expect(res.body.availabilities[0]).toHaveProperty(
        'location',
        availabilityData.location
      );
    });

    it('should return empty array if availability does not exist', async () => {
      const res = await request(app)
        .get('/api/availability/999')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('availabilities');
      expect(res.body.availabilities).toBeInstanceOf(Array);
      expect(res.body.availabilities.length).toBe(0);
    });

    it('should reject unauthenticated availability retrieval by ID', async () => {
      const res = await request(app).get('/api/availability/1');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/availability/:id', () => {
    it('should update availability successfully', async () => {
      // Create an availability first
      const createRes = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      const availabilityId = createRes.body.availabilities[0].id;

      // Update availability
      const res = await request(app)
        .put(`/api/availability/${availabilityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedAvailabilityData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Availability updated successfully'
      );
      expect(res.body).toHaveProperty('availabilities');
      expect(res.body.availabilities).toBeInstanceOf(Array);
      expect(res.body.availabilities.length).toBe(1);
      expect(res.body.availabilities[0]).toHaveProperty('id', availabilityId);
      expect(res.body.availabilities[0]).toHaveProperty(
        'location',
        updatedAvailabilityData.location
      );
    });

    it('should reject update if availability does not exist', async () => {
      const res = await request(app)
        .put('/api/availability/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedAvailabilityData);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Availability not found');
    });

    it('should reject update by non-owner', async () => {
      // Create an availability first
      const createRes = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      const availabilityId = createRes.body.availabilities[0].id;

      // Create another user
      const anotherUserData = {
        email: 'another-user@example.com',
        password: 'StrongPass123',
      };
      await request(app).post('/api/user/register').send(anotherUserData);
      const anotherUser = await prisma.user.findUnique({
        where: { email: anotherUserData.email },
      });
      await prisma.user.update({
        where: { id: anotherUser!.id },
        data: { is_verified: true, is_active: true },
      });
      const anotherUserToken = generateAccessToken({
        id: anotherUser!.id,
        email: anotherUserData.email,
        role: 'user',
      });

      // Try to update as another user
      const res = await request(app)
        .put(`/api/availability/${availabilityId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send(updatedAvailabilityData);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Availability not found');
    });

    it('should reject update with invalid data', async () => {
      // Create an availability first
      const createRes = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      const availabilityId = createRes.body.availabilities[0].id;

      // Try to update with invalid data
      const invalidData = {
        ...updatedAvailabilityData,
        start_time: 'invalid-date',
      };

      const res = await request(app)
        .put(`/api/availability/${availabilityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData);

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthenticated availability update', async () => {
      const res = await request(app)
        .put('/api/availability/1')
        .send(updatedAvailabilityData);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/availability/:id', () => {
    it('should delete availability successfully', async () => {
      // Create an availability first
      const createRes = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      const availabilityId = createRes.body.availabilities[0].id;

      // Delete availability
      const res = await request(app)
        .delete(`/api/availability/${availabilityId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Availability deleted successfully'
      );

      // Verify availability is deleted
      const availability = await prisma.availability.findUnique({
        where: { id: availabilityId },
      });
      expect(availability).toBeNull();
    });

    it('should reject deletion if availability does not exist', async () => {
      const res = await request(app)
        .delete('/api/availability/999')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Availability not found');
    });

    it('should reject deletion by non-owner', async () => {
      // Create an availability first
      const createRes = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      const availabilityId = createRes.body.availabilities[0].id;

      // Create another user
      const anotherUserData = {
        email: 'another-user@example.com',
        password: 'StrongPass123',
      };
      await request(app).post('/api/user/register').send(anotherUserData);
      const anotherUser = await prisma.user.findUnique({
        where: { email: anotherUserData.email },
      });
      await prisma.user.update({
        where: { id: anotherUser!.id },
        data: { is_verified: true, is_active: true },
      });
      const anotherUserToken = generateAccessToken({
        id: anotherUser!.id,
        email: anotherUserData.email,
        role: 'user',
      });

      // Try to delete as another user
      const res = await request(app)
        .delete(`/api/availability/${availabilityId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Availability not found');
    });

    it('should reject unauthenticated availability deletion', async () => {
      const res = await request(app).delete('/api/availability/1');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/availability/all/:targetUserId', () => {
    it('should get all availabilities for target user', async () => {
      // Create an availability first
      await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(availabilityData);

      // Create another availability
      await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...availabilityData,
          specific_date: '2025-07-02T00:00:00.000Z',
        });

      // Create another user
      const anotherUserData = {
        email: 'another-user@example.com',
        password: 'StrongPass123',
      };
      await request(app).post('/api/user/register').send(anotherUserData);
      const anotherUser = await prisma.user.findUnique({
        where: { email: anotherUserData.email },
      });
      await prisma.user.update({
        where: { id: anotherUser!.id },
        data: { is_verified: true, is_active: true },
      });
      const anotherUserToken = generateAccessToken({
        id: anotherUser!.id,
        email: anotherUserData.email,
        role: 'user',
      });

      // Get all availabilities for target user
      const res = await request(app)
        .get(`/api/availability/all/${userId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('availabilities');
      expect(res.body.availabilities).toBeInstanceOf(Array);
      expect(res.body.availabilities.length).toBe(2);
      expect(res.body.availabilities[0]).toHaveProperty('user_id', userId);
      expect(res.body.availabilities[1]).toHaveProperty('user_id', userId);
    });

    it('should return empty array if target user has no availabilities', async () => {
      // Create another user
      const anotherUserData = {
        email: 'another-user@example.com',
        password: 'StrongPass123',
      };
      await request(app).post('/api/user/register').send(anotherUserData);
      const anotherUser = await prisma.user.findUnique({
        where: { email: anotherUserData.email },
      });
      await prisma.user.update({
        where: { id: anotherUser!.id },
        data: { is_verified: true, is_active: true },
      });
      const anotherUserToken = generateAccessToken({
        id: anotherUser!.id,
        email: anotherUserData.email,
        role: 'user',
      });

      // Get all availabilities for target user with no availabilities
      const res = await request(app)
        .get(`/api/availability/all/${userId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('availabilities');
      expect(res.body.availabilities).toBeInstanceOf(Array);
      expect(res.body.availabilities.length).toBe(0);
    });

    it('should reject unauthenticated availability retrieval for target user', async () => {
      const res = await request(app).get(`/api/availability/all/${userId}`);
      expect(res.statusCode).toBe(401);
    });
  });
});

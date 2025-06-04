import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../jest.setup';
import { generateAccessToken } from '../../utils/jwt';

const prisma = new PrismaClient();

describe('Profile Routes', () => {
  // Test user data
  const userData = {
    email: 'profile-test@example.com',
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

  // Updated profile data
  const updatedProfileData = {
    first_name: 'Jane',
    last_name: 'Smith',
    bio: 'Updated bio',
    skill_level: 'Advanced',
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

  describe('POST /api/profile', () => {
    it('should create a profile successfully', async () => {
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        'message',
        'Profile created successfully'
      );
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty(
        'first_name',
        profileData.first_name
      );
      expect(res.body.profiles[0]).toHaveProperty(
        'last_name',
        profileData.last_name
      );
    });

    it('should reject duplicate profile creation', async () => {
      // Create profile first
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      // Try to create again
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('message', 'Profile already exists');
    });

    it('should reject profile creation with invalid data', async () => {
      const invalidData = {
        ...profileData,
        first_name: '', // Invalid: empty first name
      };

      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData);

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthenticated profile creation', async () => {
      const res = await request(app).post('/api/profile').send(profileData);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/profile', () => {
    it('should get user profile successfully', async () => {
      // Create profile first
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      // Get profile
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty(
        'first_name',
        profileData.first_name
      );
      expect(res.body.profiles[0]).toHaveProperty(
        'last_name',
        profileData.last_name
      );
    });

    it('should return empty profiles array if no profile exists', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(0);
    });

    it('should reject unauthenticated profile retrieval', async () => {
      const res = await request(app).get('/api/profile');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile successfully', async () => {
      // Create profile first
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      // Update profile
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedProfileData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Profile updated successfully'
      );
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty(
        'first_name',
        updatedProfileData.first_name
      );
      expect(res.body.profiles[0]).toHaveProperty(
        'last_name',
        updatedProfileData.last_name
      );
      //expect(res.body.profiles[0]).toHaveProperty('bio', updatedProfileData.bio);
      expect(res.body.profiles[0]).toHaveProperty(
        'skill_level',
        updatedProfileData.skill_level
      );
    });

    it('should reject update if profile does not exist', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedProfileData);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Profile not found');
    });

    it('should reject unauthenticated profile update', async () => {
      const res = await request(app)
        .put('/api/profile')
        .send(updatedProfileData);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/profile', () => {
    it('should delete profile successfully', async () => {
      // Create profile first
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      // Delete profile
      const res = await request(app)
        .delete('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Profile deleted successfully'
      );

      // Verify profile is deleted
      const profile = await prisma.profile.findUnique({
        where: { user_id: userId },
      });
      expect(profile).toBeNull();
    });

    it('should reject deletion if profile does not exist', async () => {
      const res = await request(app)
        .delete('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Profile not found');
    });

    it('should reject unauthenticated profile deletion', async () => {
      const res = await request(app).delete('/api/profile');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/profile/exists', () => {
    it('should return true if profile exists', async () => {
      // Create profile first
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      // Check if profile exists
      const res = await request(app)
        .get('/api/profile/exists')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('hasProfile', true);
    });

    it('should return false if profile does not exist', async () => {
      const res = await request(app)
        .get('/api/profile/exists')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('hasProfile', false);
    });

    it('should reject unauthenticated profile existence check', async () => {
      const res = await request(app).get('/api/profile/exists');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/profile/all', () => {
    it('should list all profiles', async () => {
      // Create profile first
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      // Create another user and profile
      const userData2 = {
        email: 'profile-test2@example.com',
        password: 'StrongPass123',
      };
      await request(app).post('/api/user/register').send(userData2);
      const user2 = await prisma.user.findUnique({
        where: { email: userData2.email },
      });
      await prisma.user.update({
        where: { id: user2!.id },
        data: { is_verified: true, is_active: true },
      });
      const accessToken2 = generateAccessToken({
        id: user2!.id,
        email: userData2.email,
        role: 'user',
      });

      const profileData2 = {
        ...profileData,
        first_name: 'Jane',
        last_name: 'Smith',
      };
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send(profileData2);

      // List all profiles
      const res = await request(app)
        .get('/api/profile/all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(2);
    });

    it('should return empty array if no profiles exist', async () => {
      const res = await request(app)
        .get('/api/profile/all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(0);
    });

    it('should reject unauthenticated profile listing', async () => {
      const res = await request(app).get('/api/profile/all');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/profile/search', () => {
    beforeEach(async () => {
      // Create profile first
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      // Create another user and profile
      const userData2 = {
        email: 'profile-test2@example.com',
        password: 'StrongPass123',
      };
      await request(app).post('/api/user/register').send(userData2);
      const user2 = await prisma.user.findUnique({
        where: { email: userData2.email },
      });
      await prisma.user.update({
        where: { id: user2!.id },
        data: { is_verified: true, is_active: true },
      });
      const accessToken2 = generateAccessToken({
        id: user2!.id,
        email: userData2.email,
        role: 'user',
      });

      const profileData2 = {
        ...profileData,
        first_name: 'Jane',
        last_name: 'Smith',
        city: 'New York',
        skill_level: 'Advanced',
      };
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send(profileData2);
    });

    it('should search profiles by first name', async () => {
      const res = await request(app)
        .get('/api/profile/search?q=John')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('first_name', 'John');
    });

    it('should search profiles by last name', async () => {
      const res = await request(app)
        .get('/api/profile/search?q=Smith')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('last_name', 'Smith');
    });

    it('should search profiles by city', async () => {
      const res = await request(app)
        .get('/api/profile/search?q=New York')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('city', 'New York');
    });

    it('should search profiles by skill level', async () => {
      const res = await request(app)
        .get('/api/profile/search?q=Advanced')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('skill_level', 'Advanced');
    });

    it('should reject search with empty query', async () => {
      const res = await request(app)
        .get('/api/profile/search?q=')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthenticated profile search', async () => {
      const res = await request(app).get('/api/profile/search?q=John');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/profile/filter', () => {
    beforeEach(async () => {
      // Create profile first
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData);

      // Create another user and profile
      const userData2 = {
        email: 'profile-test2@example.com',
        password: 'StrongPass123',
      };
      await request(app).post('/api/user/register').send(userData2);
      const user2 = await prisma.user.findUnique({
        where: { email: userData2.email },
      });
      await prisma.user.update({
        where: { id: user2!.id },
        data: { is_verified: true, is_active: true },
      });
      const accessToken2 = generateAccessToken({
        id: user2!.id,
        email: userData2.email,
        role: 'user',
      });

      const profileData2 = {
        ...profileData,
        first_name: 'Jane',
        last_name: 'Smith',
        city: 'New York',
        country: 'USA',
        gender: 'Female',
        skill_level: 'Advanced',
        weight_class: '60',
      };
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send(profileData2);
    });

    it('should filter profiles by skill level', async () => {
      const res = await request(app)
        .get('/api/profile/filter?level=Advanced')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('skill_level', 'Advanced');
    });

    it('should filter profiles by country', async () => {
      const res = await request(app)
        .get('/api/profile/filter?country=USA')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('country', 'USA');
    });

    it('should filter profiles by city', async () => {
      const res = await request(app)
        .get('/api/profile/filter?city=New York')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('city', 'New York');
    });

    it('should filter profiles by gender', async () => {
      const res = await request(app)
        .get('/api/profile/filter?gender=Female')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('gender', 'Female');
    });

    it('should filter profiles by weight range', async () => {
      const res = await request(app)
        .get('/api/profile/filter?minWeight=50&maxWeight=65')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('weight_class', '60');
    });

    it('should combine multiple filters', async () => {
      const res = await request(app)
        .get('/api/profile/filter?level=Advanced&gender=Female&country=USA')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('profiles');
      expect(res.body.profiles).toBeInstanceOf(Array);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0]).toHaveProperty('skill_level', 'Advanced');
      expect(res.body.profiles[0]).toHaveProperty('gender', 'Female');
      expect(res.body.profiles[0]).toHaveProperty('country', 'USA');
    });

    it('should reject unauthenticated profile filtering', async () => {
      const res = await request(app).get('/api/profile/filter?level=Advanced');
      expect(res.statusCode).toBe(401);
    });
  });
});

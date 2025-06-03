import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../jest.setup';
import { generateAccessToken } from '../../utils/jwt';

const prisma = new PrismaClient();

describe('Sparring Routes', () => {
  // Test users data
  const requesterData = {
    email: 'requester@example.com',
    password: 'StrongPass123',
  };

  const partnerData = {
    email: 'partner@example.com',
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
    photo_url: 'https://example.com/photo.jpg',
  };

  // Test availability data
  const availabilityData = {
    specific_date: '2025-07-01T00:00:00.000Z',
    start_time: '2025-07-01T14:00:00.000Z',
    end_time: '2025-07-01T16:00:00.000Z',
    location: 'Test Gym',
  };

  // Test sparring data
  const sparringData = {
    scheduled_date: '2025-07-01T00:00:00.000Z',
    start_time: '2025-07-01T14:00:00.000Z',
    end_time: '2025-07-01T16:00:00.000Z',
    location: 'Test Gym',
    notes: 'Test sparring session',
  };

  let requesterId: number;
  let partnerId: number;
  let requesterToken: string;
  let partnerToken: string;
  let availabilityId: number;

  // Helper function to create users, profiles, and availability
  const setupTestData = async () => {
    // Create requester
    await request(app).post('/api/user/register').send(requesterData);
    const requester = await prisma.user.findUnique({
      where: { email: requesterData.email },
    });
    requesterId = requester!.id;
    await prisma.user.update({
      where: { id: requesterId },
      data: { is_verified: true, is_active: true },
    });
    requesterToken = generateAccessToken({
      id: requesterId,
      email: requesterData.email,
      role: 'user',
    });

    // Create partner
    await request(app).post('/api/user/register').send(partnerData);
    const partner = await prisma.user.findUnique({
      where: { email: partnerData.email },
    });
    partnerId = partner!.id;
    await prisma.user.update({
      where: { id: partnerId },
      data: { is_verified: true, is_active: true },
    });
    partnerToken = generateAccessToken({
      id: partnerId,
      email: partnerData.email,
      role: 'user',
    });

    // Create profiles
    await request(app)
      .post('/api/profile')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send(profileData);

    await request(app)
      .post('/api/profile')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        ...profileData,
        first_name: 'Jane',
        last_name: 'Smith',
      });

    // Create availability for partner
    const availabilityRes = await request(app)
      .post('/api/availability')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send(availabilityData);

    availabilityId = availabilityRes.body.availabilities[0].id;
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
    await setupTestData();
  });

  describe('POST /api/sparring', () => {
    it('should create a sparring request successfully', async () => {
      const res = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        'message',
        'Sparring request created successfully'
      );
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(1);
      expect(res.body.sparrings[0]).toHaveProperty('requester_id', requesterId);
      expect(res.body.sparrings[0]).toHaveProperty('partner_id', partnerId);
      expect(res.body.sparrings[0]).toHaveProperty('status', 'PENDING');
    });

    it('should reject sparring request to self', async () => {
      const res = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: requesterId, // Same as requester
          availability_id: availabilityId,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'You cannot invite yourself to spar.'
      );
    });

    it('should reject unauthenticated sparring creation', async () => {
      const res = await request(app)
        .post('/api/sparring')
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      expect(res.statusCode).toBe(401);
    });

    it('should reject sparring creation with invalid data', async () => {
      const invalidData = {
        ...sparringData,
        partner_id: partnerId,
        availability_id: availabilityId,
        start_time: 'invalid-date', // Invalid date format
      };

      const res = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send(invalidData);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/sparring', () => {
    it('should get all sparrings for authenticated user', async () => {
      // Create a sparring request first
      await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      // Get all sparrings for requester
      const res = await request(app)
        .get('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(1);
      expect(res.body.sparrings[0]).toHaveProperty('requester_id', requesterId);
      expect(res.body.sparrings[0]).toHaveProperty('partner_id', partnerId);
    });

    it('should return empty array if no sparrings exist', async () => {
      const res = await request(app)
        .get('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(0);
    });

    it('should reject unauthenticated sparring retrieval', async () => {
      const res = await request(app).get('/api/sparring');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/sparring/:id', () => {
    it('should get sparring by ID', async () => {
      // Create a sparring request first
      const createRes = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      const sparringId = createRes.body.sparrings[0].id;

      // Get sparring by ID
      const res = await request(app)
        .get(`/api/sparring/${sparringId}`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(1);
      expect(res.body.sparrings[0]).toHaveProperty('id', sparringId);
      expect(res.body.sparrings[0]).toHaveProperty('requester_id', requesterId);
      expect(res.body.sparrings[0]).toHaveProperty('partner_id', partnerId);
    });

    it('should return empty array if sparring does not exist', async () => {
      const res = await request(app)
        .get('/api/sparring/999')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(0);
    });

    it('should reject unauthenticated sparring retrieval by ID', async () => {
      const res = await request(app).get('/api/sparring/1');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/sparring/:id', () => {
    it('should update sparring successfully', async () => {
      // Create a sparring request first
      const createRes = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      const sparringId = createRes.body.sparrings[0].id;

      // Update sparring
      const updatedData = {
        location: 'Updated Gym Location',
        notes: 'Updated notes',
      };

      const res = await request(app)
        .put(`/api/sparring/${sparringId}`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send(updatedData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Sparring updated successfully'
      );
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(1);
      expect(res.body.sparrings[0]).toHaveProperty(
        'location',
        updatedData.location
      );
      expect(res.body.sparrings[0]).toHaveProperty('notes', updatedData.notes);
    });

    it('should reject update if sparring does not exist', async () => {
      const res = await request(app)
        .put('/api/sparring/999')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({ location: 'Updated Gym' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Sparring not found');
    });

    it('should reject update by non-requester', async () => {
      // Create a sparring request first
      const createRes = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      const sparringId = createRes.body.sparrings[0].id;

      // Try to update as partner (not requester)
      const res = await request(app)
        .put(`/api/sparring/${sparringId}`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ location: 'Updated Gym' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Sparring not found');
    });

    it('should reject unauthenticated sparring update', async () => {
      const res = await request(app)
        .put('/api/sparring/1')
        .send({ location: 'Updated Gym' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/sparring/:id/confirm', () => {
    it('should confirm sparring successfully', async () => {
      // Create a sparring request first
      const createRes = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      const sparringId = createRes.body.sparrings[0].id;

      // Confirm sparring as partner
      const res = await request(app)
        .post(`/api/sparring/${sparringId}/confirm`)
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Sparring confirmed successfully'
      );
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(1);
      expect(res.body.sparrings[0]).toHaveProperty('status', 'CONFIRMED');
      expect(res.body.sparrings[0]).toHaveProperty('confirmed_at');
    });

    it('should reject confirmation by non-partner', async () => {
      // Create a sparring request first
      const createRes = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      const sparringId = createRes.body.sparrings[0].id;

      // Try to confirm as requester (not partner)
      const res = await request(app)
        .post(`/api/sparring/${sparringId}/confirm`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Not allowed');
    });

    it('should reject confirmation of non-existent sparring', async () => {
      const res = await request(app)
        .post('/api/sparring/999/confirm')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Not found');
    });

    it('should reject unauthenticated sparring confirmation', async () => {
      const res = await request(app).post('/api/sparring/1/confirm');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/sparring/:id/cancel', () => {
    it('should cancel sparring as requester', async () => {
      // Create a sparring request first
      const createRes = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      const sparringId = createRes.body.sparrings[0].id;

      // Cancel sparring as requester
      const res = await request(app)
        .post(`/api/sparring/${sparringId}/cancel`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({ reason: 'Test cancellation reason' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Sparring cancelled successfully'
      );
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(1);
      expect(res.body.sparrings[0]).toHaveProperty('status', 'CANCELLED');
      expect(res.body.sparrings[0]).toHaveProperty(
        'cancelled_by_user_id',
        requesterId
      );
      expect(res.body.sparrings[0]).toHaveProperty(
        'cancellation_reason',
        'Test cancellation reason'
      );
    });

    it('should cancel sparring as partner', async () => {
      // Create a sparring request first
      const createRes = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      const sparringId = createRes.body.sparrings[0].id;

      // Cancel sparring as partner
      const res = await request(app)
        .post(`/api/sparring/${sparringId}/cancel`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ reason: 'Partner cancellation reason' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Sparring cancelled successfully'
      );
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(1);
      expect(res.body.sparrings[0]).toHaveProperty('status', 'CANCELLED');
      expect(res.body.sparrings[0]).toHaveProperty(
        'cancelled_by_user_id',
        partnerId
      );
      expect(res.body.sparrings[0]).toHaveProperty(
        'cancellation_reason',
        'Partner cancellation reason'
      );
    });

    it('should reject cancellation by non-participant', async () => {
      // Create a sparring request first
      const createRes = await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      const sparringId = createRes.body.sparrings[0].id;

      // Create a third user
      const thirdUserData = {
        email: 'third@example.com',
        password: 'StrongPass123',
      };
      await request(app).post('/api/user/register').send(thirdUserData);
      const thirdUser = await prisma.user.findUnique({
        where: { email: thirdUserData.email },
      });
      await prisma.user.update({
        where: { id: thirdUser!.id },
        data: { is_verified: true, is_active: true },
      });
      const thirdUserToken = generateAccessToken({
        id: thirdUser!.id,
        email: thirdUserData.email,
        role: 'user',
      });

      // Try to cancel as third user (not requester or partner)
      const res = await request(app)
        .post(`/api/sparring/${sparringId}/cancel`)
        .set('Authorization', `Bearer ${thirdUserToken}`)
        .send({ reason: 'Third user cancellation' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Not allowed');
    });

    it('should reject cancellation of non-existent sparring', async () => {
      const res = await request(app)
        .post('/api/sparring/999/cancel')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({ reason: 'Test reason' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Not found');
    });

    it('should reject unauthenticated sparring cancellation', async () => {
      const res = await request(app)
        .post('/api/sparring/1/cancel')
        .send({ reason: 'Test reason' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/sparring/all/:partnerId', () => {
    it('should get all sparrings between requester and partner', async () => {
      // Create multiple sparring requests
      await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      await request(app)
        .post('/api/sparring')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ...sparringData,
          scheduled_date: '2025-07-02T00:00:00.000Z',
          partner_id: partnerId,
          availability_id: availabilityId,
        });

      // Get all sparrings between requester and partner
      const res = await request(app)
        .get(`/api/sparring/all/${partnerId}`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(2);
      expect(res.body.sparrings[0]).toHaveProperty('requester_id', requesterId);
      expect(res.body.sparrings[0]).toHaveProperty('partner_id', partnerId);
      expect(res.body.sparrings[1]).toHaveProperty('requester_id', requesterId);
      expect(res.body.sparrings[1]).toHaveProperty('partner_id', partnerId);
    });

    it('should return empty array if no sparrings exist between users', async () => {
      const res = await request(app)
        .get(`/api/sparring/all/${partnerId}`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sparrings');
      expect(res.body.sparrings).toBeInstanceOf(Array);
      expect(res.body.sparrings.length).toBe(0);
    });

    it('should reject unauthenticated sparring retrieval', async () => {
      const res = await request(app).get(`/api/sparring/all/${partnerId}`);
      expect(res.statusCode).toBe(401);
    });
  });
});

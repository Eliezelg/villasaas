import { getTestApp, closeTestApp, cleanDatabase, createAuthHeader } from '../helpers/test-utils';
import type { FastifyInstance } from 'fastify';

describe('Auth Routes Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app.prisma);
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Test1234!',
          firstName: 'John',
          lastName: 'Doe',
          companyName: 'Test Company',
          phone: '+33612345678',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('tenant');
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234!',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(409);
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'short',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234!',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Test Company',
    };

    beforeEach(async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });
    });

    it('should login with correct credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: userData.email,
          password: 'WrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Test1234!',
          firstName: 'John',
          lastName: 'Doe',
          companyName: 'Test Company',
        },
      });

      const { accessToken } = JSON.parse(registerResponse.body);

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: createAuthHeader(accessToken),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('tenant');
    });

    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
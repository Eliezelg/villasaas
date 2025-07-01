import { AuthService } from '../auth.service';
import { getTestApp, closeTestApp, cleanDatabase } from '../../../__tests__/helpers/test-utils';
import type { FastifyInstance } from 'fastify';

describe('AuthService', () => {
  let app: FastifyInstance;
  let authService: AuthService;

  beforeAll(async () => {
    app = await getTestApp();
    authService = new AuthService(app);
  });

  beforeEach(async () => {
    await cleanDatabase(app.prisma);
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('register', () => {
    it('should register a new tenant and owner user', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test1234!',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
        phone: '+33612345678',
      };

      const result = await authService.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      expect(result.user.email).toBe(registerData.email);
      expect(result.user.firstName).toBe(registerData.firstName);
      expect(result.user.lastName).toBe(registerData.lastName);
      expect(result.user.role).toBe('OWNER');

      expect(result.tenant.name).toBe(`${registerData.firstName} ${registerData.lastName}`);
      expect(result.tenant.subdomain).toBe('test-company');
    });

    it('should throw error if email already exists', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test1234!',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      await authService.register(registerData);

      await expect(authService.register(registerData)).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234!',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Test Company',
    };

    beforeEach(async () => {
      await authService.register(userData);
    });

    it('should login with correct credentials', async () => {
      const result = await authService.login({
        email: userData.email,
        password: userData.password,
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
    });

    it('should throw error with wrong password', async () => {
      await expect(
        authService.login({
          email: userData.email,
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: userData.password,
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test1234!',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      const { refreshToken } = await authService.register(registerData);
      const result = await authService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).not.toBe(refreshToken); // Should be a new token
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });
});
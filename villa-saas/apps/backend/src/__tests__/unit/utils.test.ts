import { hashPassword, verifyPassword } from '@villa-saas/utils';
import { getTenantId, createTenantFilter, addTenantToData } from '@villa-saas/utils';
import type { FastifyRequest } from 'fastify';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'Test1234!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Test1234!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'Test1234!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(hash, password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Test1234!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(hash, 'WrongPassword!');
      expect(isValid).toBe(false);
    });
  });
});

describe('Tenant Utils', () => {
  describe('getTenantId', () => {
    it('should return tenant ID from request', () => {
      const request = { tenantId: 'tenant-123' } as FastifyRequest;
      const tenantId = getTenantId(request);
      expect(tenantId).toBe('tenant-123');
    });

    it('should throw error if tenant ID not found', () => {
      const request = {} as FastifyRequest;
      expect(() => getTenantId(request)).toThrow('Tenant ID not found in request');
    });
  });

  describe('createTenantFilter', () => {
    it('should create tenant filter object', () => {
      const filter = createTenantFilter('tenant-123');
      expect(filter).toEqual({ tenantId: 'tenant-123' });
    });
  });

  describe('addTenantToData', () => {
    it('should add tenant ID to data object', () => {
      const data = { name: 'Test', value: 123 };
      const result = addTenantToData(data, 'tenant-123');
      
      expect(result).toEqual({
        name: 'Test',
        value: 123,
        tenantId: 'tenant-123',
      });
    });

    it('should preserve existing properties', () => {
      const data = { 
        name: 'Test', 
        nested: { value: 456 },
        array: [1, 2, 3],
      };
      const result = addTenantToData(data, 'tenant-123');
      
      expect(result.nested).toEqual({ value: 456 });
      expect(result.array).toEqual([1, 2, 3]);
      expect(result.tenantId).toBe('tenant-123');
    });
  });
});
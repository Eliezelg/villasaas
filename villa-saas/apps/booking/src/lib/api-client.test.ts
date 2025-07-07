import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { apiClient } from './api-client';

// Mock fetch
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  describe('get', () => {
    it('should make GET request with tenant header', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Set tenant cookie
      document.cookie = 'tenant=demo';

      const result = await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Tenant': 'demo',
          }),
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
      });

      const result = await apiClient.get('/not-found');

      expect(result.error).toBe('Not found');
      expect(result.data).toBeNull();
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      const mockResponse = { id: '123' };
      const postData = { name: 'Test' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      document.cookie = 'tenant=demo';

      const result = await apiClient.post('/test', postData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Tenant': 'demo',
          }),
          body: JSON.stringify(postData),
        })
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('tenant detection', () => {
    it('should get tenant from cookie', () => {
      document.cookie = 'tenant=custom-tenant';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant': 'custom-tenant',
          }),
        })
      );
    });

    it('should use empty string if no tenant cookie', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant': '',
          }),
        })
      );
    });
  });
});
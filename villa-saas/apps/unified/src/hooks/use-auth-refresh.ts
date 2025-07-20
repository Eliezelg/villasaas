'use client';

import { useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes (refresh 1 minute before expiry)

export function useAuthRefresh() {
  const { user, isAuthenticated } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Function to refresh token
    const refreshToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          // No Content-Type header needed since we're not sending a body
          // The refresh token is sent via cookies
        });

        if (!response.ok) {
          console.error('Failed to refresh token');
          // If refresh fails, the user will be logged out on next request
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    };

    // Don't refresh immediately after mount - wait a bit to avoid conflicts with initial auth
    const initialTimeout = setTimeout(() => {
      refreshToken();
    }, 5000); // 5 second delay

    // Set up interval for automatic refresh
    intervalRef.current = setInterval(refreshToken, REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (initialTimeout) {
        clearTimeout(initialTimeout);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, user]);
}
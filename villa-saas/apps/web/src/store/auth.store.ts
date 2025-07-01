import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import type { User, Tenant, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        
        const { data, error } = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
        
        if (error || !data) {
          set({ isLoading: false });
          return { success: false, error: error?.message || 'Login failed' };
        }

        const { user, tenant, accessToken, refreshToken } = data;
        
        apiClient.setAccessToken(accessToken);
        
        set({
          user,
          tenant,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      },

      register: async (data) => {
        set({ isLoading: true });
        
        const { data: response, error } = await apiClient.post<AuthResponse>('/api/auth/register', data);
        
        if (error || !response) {
          set({ isLoading: false });
          return { success: false, error: error?.message || 'Registration failed' };
        }

        const { user, tenant, accessToken, refreshToken } = response;
        
        apiClient.setAccessToken(accessToken);
        
        set({
          user,
          tenant,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      },

      logout: async () => {
        const { accessToken } = get();
        
        if (accessToken) {
          await apiClient.post('/api/auth/logout');
        }
        
        apiClient.setAccessToken(null);
        
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          return false;
        }

        const { data, error } = await apiClient.post<{
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>('/api/auth/refresh', { refreshToken });

        if (error || !data) {
          set({
            user: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return false;
        }

        apiClient.setAccessToken(data.accessToken);
        
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        return true;
      },

      checkAuth: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          set({ isAuthenticated: false });
          return;
        }

        apiClient.setAccessToken(accessToken);
        
        const { data, error } = await apiClient.get<User>('/api/auth/me');
        
        if (error || !data) {
          // Try to refresh the session
          const refreshed = await get().refreshSession();
          
          if (!refreshed) {
            set({
              user: null,
              tenant: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
            });
          }
          return;
        }

        set({
          user: data,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        tenant: state.tenant,
      }),
    }
  )
);
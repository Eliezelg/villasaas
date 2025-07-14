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
  setUser: (user: User) => void;
  setTenant: (tenant: Tenant) => void;
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

        // Les tokens sont maintenant gérés par des cookies HttpOnly côté serveur
        // On ne stocke plus les tokens côté client pour la sécurité
        const { user, tenant } = data;
        
        set({
          user,
          tenant,
          accessToken: null, // Plus de stockage côté client
          refreshToken: null, // Plus de stockage côté client
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

        // Les tokens sont maintenant gérés par des cookies HttpOnly côté serveur
        const { user, tenant } = response;
        
        set({
          user,
          tenant,
          accessToken: null, // Plus de stockage côté client
          refreshToken: null, // Plus de stockage côté client
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      },

      logout: async () => {
        // Appeler l'endpoint de logout qui va supprimer les cookies côté serveur
        await apiClient.post('/api/auth/logout');
        
        // Réinitialiser l'état local
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshSession: async () => {
        // Le refresh token est dans les cookies, il sera envoyé automatiquement
        const { data, error } = await apiClient.post<{
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>('/api/auth/refresh', {});

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

        // Les nouveaux tokens sont définis dans les cookies par le serveur
        return true;
      },

      checkAuth: async () => {
        // Les cookies sont envoyés automatiquement avec la requête
        const { data, error } = await apiClient.get<User>('/api/auth/me');
        
        if (error || !data) {
          set({
            user: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return;
        }

        set({
          user: data,
          // tenant is kept from login/register, not updated from /me endpoint
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      setTenant: (tenant) => {
        set({ tenant });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Ne plus stocker les tokens dans localStorage
        user: state.user,
        tenant: state.tenant,
      }),
    }
  )
);
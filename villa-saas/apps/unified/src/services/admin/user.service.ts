import { apiClient } from '@/lib/api-client'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'OWNER' | 'ADMIN' | 'USER'
  active: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface InviteUserDto {
  email: string
  role: 'USER' | 'ADMIN'
}

export interface UpdateUserDto {
  active?: boolean
  role?: 'USER' | 'ADMIN'
}

class UserService {
  async getAll() {
    return apiClient.get<User[]>('/api/users')
  }

  async getById(id: string) {
    return apiClient.get<User>(`/api/users/${id}`)
  }

  async invite(data: InviteUserDto) {
    return apiClient.post<{ message: string }>('/api/users/invite', data)
  }

  async update(id: string, data: UpdateUserDto) {
    return apiClient.patch<User>(`/api/users/${id}`, data)
  }

  async delete(id: string) {
    return apiClient.delete(`/api/users/${id}`)
  }

  async resendInvite(userId: string) {
    return apiClient.post<{ message: string }>(`/api/users/${userId}/resend-invite`)
  }
}

export const userService = new UserService()
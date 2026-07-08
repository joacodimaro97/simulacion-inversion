import { http } from '@/api/http'
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types/api'

export const AuthService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await http.post<AuthResponse>('/auth/login', input)
    return data
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await http.post<AuthResponse>('/auth/register', input)
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await http.get<User>('/auth/me')
    return data
  },
}

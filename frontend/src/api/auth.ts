import axios from 'axios'
import api from './axios'
import { useAuthStore } from '../store/auth.store'

export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const res = await api.post('/auth/register', { email, password, name })
    return res.data
  },

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    // Сохраняем только в памяти
    useAuthStore.getState().setToken(res.data.accessToken)
    return res.data
  },

  logout: async () => {
    await api.post('/auth/logout')
    useAuthStore.getState().clearToken()
  },

  refresh: async () => {
    const res = await axios.post('http://localhost:3000/api/auth/refresh', {}, {
      withCredentials: true,
    })
    useAuthStore.getState().setToken(res.data.accessToken)
    return res.data
  },
}
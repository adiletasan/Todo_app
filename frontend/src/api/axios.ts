import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // отправляет httpOnly cookie автоматически
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res = await axios.post('http://localhost:3000/api/auth/refresh', {}, {
          withCredentials: true,
        })
        const newToken = res.data.accessToken
        useAuthStore.getState().setToken(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (err) {
        useAuthStore.getState().clearToken()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
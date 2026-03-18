import api from './axios'

export const usersApi = {
  getMe: async () => {
    const res = await api.get('/users/me')
    return res.data
  },

  updateMe: async (data: { name?: string; timezone?: string }) => {
    const res = await api.put('/users/me', data)
    return res.data
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
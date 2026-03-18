import api from './axios'

export const tasksApi = {
  getAll: async (params?: {
    status?: string
    priority?: string
    sortBy?: string
    sortOrder?: string
    limit?: number
    offset?: number
  }) => {
    const res = await api.get('/tasks', { params })
    return res.data
  },

  getOne: async (id: string) => {
    const res = await api.get(`/tasks/${id}`)
    return res.data
  },

  create: async (data: {
    title: string
    description?: string
    priority?: string
    due_date?: string
  }) => {
    const res = await api.post('/tasks', data)
    return res.data
  },

  update: async (id: string, data: {
    title?: string
    description?: string
    priority?: string
    due_date?: string
  }) => {
    const res = await api.put(`/tasks/${id}`, data)
    return res.data
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.patch(`/tasks/${id}/status`, { status })
    return res.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/tasks/${id}`)
    return res.data
  },

  getCategories: async () => {
    const res = await api.get('/tasks/categories')
    return res.data
  },

  createCategory: async (data: { name: string; color?: string }) => {
    const res = await api.post('/tasks/categories', data)
    return res.data
  },

  deleteCategory: async (id: string) => {
    const res = await api.delete(`/tasks/categories/${id}`)
    return res.data
  },
}
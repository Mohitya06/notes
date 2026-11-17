import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(err)
  },
)

export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

export const workspacesApi = {
  create: (name: string) => api.post('/workspaces', { name }),
  list: () => api.get('/workspaces'),
  get: (id: string) => api.get(`/workspaces/${id}`),
}

export const pagesApi = {
  create: (workspaceId: string, parentPageId?: string) =>
    api.post('/pages', { workspaceId, parentPageId }),
  listByWorkspace: (workspaceId: string) =>
    api.get(`/pages/workspace/${workspaceId}`),
  get: (id: string) => api.get(`/pages/${id}`),
  updateTitle: (id: string, title: string) =>
    api.patch(`/pages/${id}/title`, { title }),
  delete: (id: string) => api.delete(`/pages/${id}`),
}

export default api

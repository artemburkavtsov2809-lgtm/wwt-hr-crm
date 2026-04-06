import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Інтерцептор для додавання токену
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Інтерцептор для обробки помилок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Якщо 401 і це не запит на refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/token/refresh/`, {
            refresh: refresh
          })
          
          if (res.data.access) {
            localStorage.setItem('access_token', res.data.access)
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
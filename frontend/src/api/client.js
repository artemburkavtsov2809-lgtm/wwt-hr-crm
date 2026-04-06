import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

console.log('API BASE_URL:', BASE_URL)

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Інтерцептор для додавання токену
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  console.log(`📤 Запит до ${config.url}, токен: ${token ? 'є ✅' : 'немає ❌'}`)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  console.error('Request error:', error)
  return Promise.reject(error)
})

// Інтерцептор для обробки помилок
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Відповідь від ${response.config.url}: ${response.status}`)
    return response
  },
  async (error) => {
    console.error(`❌ Помилка від ${error.config?.url}:`, error.response?.status, error.response?.data)
    
    const originalRequest = error.config
    
    // Якщо 401 і це не запит на refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refresh = localStorage.getItem('refresh_token')
      console.log('Спроба оновити токен, refresh_token:', refresh ? 'є' : 'немає')
      
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/token/refresh/`, {
            refresh: refresh
          })
          
          if (res.data.access) {
            console.log('Токен оновлено успішно')
            localStorage.setItem('access_token', res.data.access)
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('Помилка оновлення токену:', refreshError)
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        console.log('Немає refresh_token, вихід')
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
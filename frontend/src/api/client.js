import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

console.log('API BASE_URL:', BASE_URL)

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Глобальні змінні для управління оновленням токена
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

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
    const originalRequest = error.config
    
    if (!error.response || error.response.status !== 401) {
      console.error(`❌ Помилка від ${originalRequest?.url}:`, error.response?.status, error.response?.data)
      return Promise.reject(error)
    }

    console.log(`🔄 401 від ${originalRequest.url}, обробляємо...`)

    // Якщо вже оновлюємо токен — ставимо в чергу
    if (isRefreshing) {
      console.log('⏳ Оновлення вже йде, чекаємо...')
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      }).catch(err => {
        return Promise.reject(err)
      })
    }

    // Якщо це повторна спроба — не зациклюємось
    if (originalRequest._retry) {
      console.log('❌ Повторна спроба не вдалась, виходимо')
      localStorage.clear()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    originalRequest._retry = true
    isRefreshing = true

    const refresh = localStorage.getItem('refresh_token')
    console.log('🔑 Спроба оновити токен, refresh_token:', refresh ? 'є' : 'немає')

    if (!refresh) {
      console.log('❌ Немає refresh_token')
      processQueue(new Error('No refresh token'), null)
      isRefreshing = false
      localStorage.clear()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const res = await axios.post(`${BASE_URL}/token/refresh/`, {
        refresh: refresh
      })

      if (res.data.access) {
        console.log('✅ Токен оновлено:', res.data.access.substring(0, 50) + '...')
        localStorage.setItem('access_token', res.data.access)
        
        // Оновлюємо заголовок для оригінального запиту
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`
        
        // Обробляємо чергу
        processQueue(null, res.data.access)
        isRefreshing = false
        
        // Повторюємо оригінальний запит
        console.log(`🔄 Повторюємо ${originalRequest.url}...`)
        return api(originalRequest)
      }
    } catch (refreshError) {
      console.error('❌ Помилка оновлення токену:', refreshError.response?.data || refreshError.message)
      processQueue(refreshError, null)
      isRefreshing = false
      localStorage.clear()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    }
  }
)

export default api
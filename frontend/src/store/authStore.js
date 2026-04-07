import { create } from 'zustand'
import axios from 'axios'
import api from '../api/client'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (username, password) => {
    try {
      console.log('1. Спроба логіну до:', `${API_URL}/token/`)
      
      const res = await axios.post(`${API_URL}/token/`, { 
        username, 
        password 
      })
      
      console.log('2. Відповідь від сервера:', res.data)
      
      if (!res.data.access) {
        throw new Error('Сервер не повернув access_token')
      }
      
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      
      console.log('3. Токени збережено')
      
      // Завжди підтягуємо повні дані з API після логіну
      console.log('4. Завантажуємо дані користувача з API...')
      const userData = await get().fetchUser()
      
      if (!userData) {
        throw new Error('Не вдалося отримати дані користувача з API')
      }
      
      console.log('5. Дані користувача отримано:', userData)
      
      return res.data
    } catch (error) {
      console.error('❌ Помилка логіну:', error.response?.data || error.message)
      throw error
    }
  },

  getUserFromToken: () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.log('getUserFromToken: немає токену')
      return null
    }
    
    try {
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      
      const userId = decoded.user_id || decoded.id
      
      return {
        id: userId,
        username: decoded.username || null, // null якщо немає
        email: decoded.email || null,
        is_superuser: decoded.is_superuser || userId === 1 || userId === 2,
        is_staff: decoded.is_staff || userId === 1 || userId === 2,
        first_name: decoded.first_name || null,
      }
    } catch (error) {
      console.error('Помилка декодування токену:', error)
      return null
    }
  },

  fetchUser: async () => {
    // Перевіряємо всі можливі ендпоїнти
    const possibleEndpoints = [
      '/auth/users/me/',
      '/users/me/',
      '/me/',
      '/user/',
      '/users/current/',
      '/api/auth/users/me/',
      '/api/users/me/',
    ]
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Спроба ендпоїнта: ${endpoint}`)
        const res = await api.get(endpoint)
        
        if (res.data) {
          console.log(`✅ Успіх! ${endpoint}:`, res.data)
          
          // Нормалізуємо дані (різні API можуть повертати по-різному)
          const userData = {
            id: res.data.id || res.data.user_id || res.data.pk,
            username: res.data.username || res.data.login || res.data.user_name,
            email: res.data.email,
            first_name: res.data.first_name || res.data.firstName,
            last_name: res.data.last_name || res.data.lastName,
            is_superuser: res.data.is_superuser || res.data.isSuperuser,
            is_staff: res.data.is_staff || res.data.isStaff,
          }
          
          set({ 
            isAuthenticated: true,
            user: userData 
          })
          
          return userData
        }
      } catch (e) {
        console.log(`❌ ${endpoint}:`, e.response?.status, e.response?.statusText)
      }
    }
    
    console.error('❌ Жоден ендпоїнт не працює!')
    return null
  },

  logout: () => {
    console.log('Вихід із системи')
    localStorage.clear()
    set({ isAuthenticated: false, user: null })
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('access_token')
    console.log('checkAuth: токен є?', !!token)
    
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return false
    }
    
    try {
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      const exp = decoded.exp * 1000
      const now = Date.now()
      
      if (now >= exp) {
        console.log('Токен прострочено')
        get().logout()
        return false
      }
      
      // Завжди підтягуємо свіжі дані з API
      console.log('Токен валідний, оновлюємо дані з API...')
      const userData = await get().fetchUser()
      
      return !!userData
    } catch (error) {
      console.error('Помилка перевірки токену:', error)
      get().logout()
      return false
    }
  }
}))

export default useAuthStore
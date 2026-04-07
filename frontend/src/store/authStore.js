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
      
      console.log('3. Токени збережено в localStorage')
      
      // Отримуємо дані користувача з токену
      const userData = get().getUserFromToken()
      console.log('4. Дані з токену:', userData)
      
      set({ 
        isAuthenticated: true,
        user: userData
      })
      
      // Якщо в токені немає username — підтягуємо з API
      if (!userData.username || userData.username === `user_${userData.id}`) {
        console.log('5. Username відсутній у токені, завантажуємо з API...')
        await get().fetchUser()
      }
      
      console.log('6. Стан оновлено:', get().user)
      
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
      console.log('Декодований payload:', decoded)
      
      const userId = decoded.user_id || decoded.id
      
      // Якщо поля відсутні — використовуємо ID як fallback
      return {
        id: userId,
        username: decoded.username || `user_${userId}`,
        email: decoded.email || '',
        is_superuser: decoded.is_superuser || userId === 1 || userId === 2,
        is_staff: decoded.is_staff || userId === 1 || userId === 2,
        first_name: decoded.first_name || '',
      }
    } catch (error) {
      console.error('Помилка декодування токену:', error)
      return null
    }
  },

  fetchUser: async () => {
    const possibleEndpoints = [
      '/users/me/',
      '/auth/users/me/', 
      '/me/',
      '/current_user/',
      '/auth/me/',
      '/user/',
      '/users/current/'
    ]
    
    for (const endpoint of possibleEndpoints) {
      try {
        const res = await api.get(endpoint)
        if (res.data) {
          console.log(`✅ Ендпоїнт ${endpoint} працює:`, res.data)
          set({ user: res.data })
          return res.data
        }
      } catch (e) {
        console.log(`❌ Ендпоїнт ${endpoint} не працює:`, e.response?.status)
      }
    }
    
    console.warn('⚠️ Не вдалося отримати дані користувача з API')
    return null
  },

  logout: () => {
    console.log('Вихід із системи')
    localStorage.clear()
    set({ isAuthenticated: false, user: null })
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('access_token')
    
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
      
      const userData = get().getUserFromToken()
      set({ isAuthenticated: true, user: userData })
      
      // Якщо немає username — підтягуємо з API
      if (!userData.username || userData.username.startsWith('user_')) {
        get().fetchUser()
      }
      
      return true
    } catch (error) {
      console.error('Помилка перевірки токену:', error)
      get().logout()
      return false
    }
  }
}))

export default useAuthStore
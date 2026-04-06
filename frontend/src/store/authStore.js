import { create } from 'zustand'
import axios from 'axios'
import api from '../api/client'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/token/`, { 
        username, 
        password 
      })
      
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      
      // Отримуємо дані користувача з токену
      const userData = get().getUserFromToken()
      
      set({ 
        isAuthenticated: true,
        user: userData
      })
      
      return res.data
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      throw error
    }
  },

  // Отримання даних з JWT токену
  getUserFromToken: () => {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    
    try {
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      
      // Мапінг полів з токену
      return {
        id: decoded.user_id || decoded.id,
        username: decoded.username,
        email: decoded.email,
        ...decoded
      }
    } catch (error) {
      console.error('Помилка декодування токену:', error)
      return null
    }
  },

  // Спроба отримати користувача з API (якщо ендпоінт з'явиться)
  fetchUser: async () => {
    // Спочатку спробуємо отримати з токену
    const userFromToken = get().getUserFromToken()
    if (userFromToken) {
      set({ user: userFromToken })
      return userFromToken
    }
    
    // Якщо немає в токені, пробуємо різні ендпоінти
    const possibleEndpoints = [
      '/users/me/',
      '/auth/users/me/', 
      '/me/',
      '/current_user/',
      '/auth/me/',
      '/user/'
    ]
    
    for (const endpoint of possibleEndpoints) {
      try {
        const res = await api.get(endpoint)
        if (res.data) {
          console.log(`✅ Ендпоінт ${endpoint} працює:`, res.data)
          set({ user: res.data })
          return res.data
        }
      } catch (e) {
        // Продовжуємо пошук
      }
    }
    
    console.warn('Не вдалося отримати дані користувача')
    return null
  },

  logout: () => {
    localStorage.clear()
    set({ isAuthenticated: false, user: null })
  },
  
  // Перевірка чи є токен валідним
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
      
      if (Date.now() >= exp) {
        // Токен прострочено
        get().logout()
        return false
      }
      
      set({ isAuthenticated: true })
      return true
    } catch {
      get().logout()
      return false
    }
  }
}))

export default useAuthStore
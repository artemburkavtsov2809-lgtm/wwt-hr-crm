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
      
      // Зберігаємо токени І username
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      localStorage.setItem('username', username) // ← ЗБЕРІГАЄМО НІК!
      
      console.log('3. Токени та username збережено')
      
      // Отримуємо дані з токену + додаємо username
      const tokenData = get().getUserFromToken()
      const userData = {
        ...tokenData,
        username: username, // ← ВИКОРИСТОВУЄМО НІК З ЛОГІНУ
      }
      
      set({ 
        isAuthenticated: true,
        user: userData
      })
      
      console.log('4. Користувач авторизований:', userData)
      
      return res.data
    } catch (error) {
      console.error('❌ Помилка логіну:', error.response?.data || error.message)
      throw error
    }
  },

  getUserFromToken: () => {
    const token = localStorage.getItem('access_token')
    const savedUsername = localStorage.getItem('username') // ← БЕРЕМО З localStorage
    
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
        username: savedUsername || decoded.username || `user_${userId}`,
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

  logout: () => {
    console.log('Вихід із системи')
    localStorage.clear() // ← Очищає ВСЕ включаючи username
    set({ isAuthenticated: false, user: null })
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('access_token')
    const savedUsername = localStorage.getItem('username')
    
    console.log('checkAuth: токен є?', !!token, 'username є?', !!savedUsername)
    
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
      
      console.log('Токен валідний, користувач:', userData)
      return true
    } catch (error) {
      console.error('Помилка перевірки токену:', error)
      get().logout()
      return false
    }
  }
}))

export default useAuthStore
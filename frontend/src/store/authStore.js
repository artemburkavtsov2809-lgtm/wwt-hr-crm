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
      console.log('   access_token:', res.data.access.substring(0, 50) + '...')
      
      // Отримуємо дані користувача з токену
      const userData = get().getUserFromToken()
      console.log('4. Дані з токену:', userData)
      
      set({ 
        isAuthenticated: true,
        user: userData
      })
      
      console.log('5. Стан оновлено: isAuthenticated = true')
      
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
    
    // Якщо user_id = 1 або 2 - це суперюзер
    const isSuperUser = decoded.user_id === 1 || decoded.user_id === 2
    
    return {
      id: decoded.user_id || decoded.id,
      username: decoded.username || 'admin',
      email: decoded.email || 'admin@example.com',
      is_superuser: isSuperUser,  // <-- ОСЬ ЦЕ ВАЖЛИВО
      is_staff: isSuperUser,
      first_name: decoded.first_name || 'Admin',
    }
  } catch (error) {
    console.error('Помилка декодування токену:', error)
    return null
  }
},

  fetchUser: async () => {
    const userFromToken = get().getUserFromToken()
    if (userFromToken) {
      set({ user: userFromToken })
      return userFromToken
    }
    
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
        console.log(`❌ Ендпоінт ${endpoint} не працює:`, e.response?.status)
      }
    }
    
    console.warn('Не вдалося отримати дані користувача')
    return null
  },

  logout: () => {
    console.log('Вихід із системи')
    localStorage.clear()
    set({ isAuthenticated: false, user: null })
  },
  
  checkAuth: () => {
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
      
      console.log(`Термін дії: ${new Date(exp)}, зараз: ${new Date(now)}`)
      
      if (now >= exp) {
        console.log('Токен прострочено')
        get().logout()
        return false
      }
      
      console.log('Токен валідний')
      set({ isAuthenticated: true })
      return true
    } catch (error) {
      console.error('Помилка перевірки токену:', error)
      get().logout()
      return false
    }
  }
}))

export default useAuthStore
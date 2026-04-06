import { create } from 'zustand'
import axios from 'axios'
import api from '../api/client'

// Додайте цю змінну (або імпортуйте з конфігу)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (username, password) => {
    try {
      // Виправлено: додано await та правильний URL
      const res = await axios.post(`${API_URL}/token/`, { 
        username, 
        password 
      })
      
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      
      set({ isAuthenticated: true })
      return res.data
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      throw error
    }
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/users/me/') // Змінив на правильний ендпоінт
      set({ user: res.data })
      return res.data
    } catch (error) {
      console.error('Fetch user error:', error.response?.data || error.message)
      set({ user: null })
      localStorage.clear()
      throw error
    }
  },

  logout: () => {
    localStorage.clear()
    set({ isAuthenticated: false, user: null })
  },
}))

export default useAuthStore
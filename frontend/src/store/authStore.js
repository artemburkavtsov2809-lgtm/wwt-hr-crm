import { create } from 'zustand'
import axios from 'axios'
import api from '../api/client'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (username, password) => {
    const res = await axios.post('http://127.0.0.1:8000/api/token/', {
      username,
      password,
    })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    set({ isAuthenticated: true })
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/me/')
      set({ user: res.data })
    } catch {
      set({ user: null })
      localStorage.clear()
    }
  },

  logout: () => {
    localStorage.clear()
    set({ isAuthenticated: false, user: null })
  },
}))

export default useAuthStore
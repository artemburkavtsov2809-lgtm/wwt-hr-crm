import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import HrNeeds from './pages/HrNeeds'
import Performance from './pages/Performance'
import Documents from './pages/Documents'
import Admin from './pages/Admin'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  
  if (!isAuthenticated) return <Navigate to="/login" />
  if (user === null) return <div style={{ padding: 20 }}>Завантаження...</div>
  
  // Перевіряємо різні варіанти прав адміністратора
  const isAdmin = user.is_superuser === true || 
                  user.is_staff === true || 
                  user.role === 'admin' ||
                  user.user_type === 'admin' ||
                  user.id === 2 ||  // Тимчасово: ваш user_id з токену
                  user.username === 'admin'  // Тимчасово: перевірка за іменем
  
  if (isAdmin) {
    return <Layout>{children}</Layout>
  }
  
  return <Navigate to="/" />
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const getUserFromToken = useAuthStore((s) => s.getUserFromToken)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const user = useAuthStore((s) => s.user)
  const [userLoaded, setUserLoaded] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      const isValid = checkAuth()
      if (isValid) {
        const userData = getUserFromToken()
        if (userData) {
          console.log('Встановлення даних користувача:', userData)
          useAuthStore.setState({ 
            isAuthenticated: true, 
            user: userData 
          })
        }
      }
    } else if (!user) {
      const userData = getUserFromToken()
      if (userData) {
        useAuthStore.setState({ user: userData })
      }
    }
    setUserLoaded(true)
  }, [])

  if (!userLoaded) return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Завантаження...</div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
      <Route path="/hr-needs" element={<PrivateRoute><HrNeeds /></PrivateRoute>} />
      <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />
      <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
      <Route path="/admin-panel" element={<AdminRoute><Admin /></AdminRoute>} />
    </Routes>
  )
}
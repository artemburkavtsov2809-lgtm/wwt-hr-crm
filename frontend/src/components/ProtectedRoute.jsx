import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  
  // Перевіряємо автентифікацію при завантаженні
  if (!isAuthenticated && !checkAuth()) {
    return <Navigate to="/login" replace />
  }
  
  return children
}
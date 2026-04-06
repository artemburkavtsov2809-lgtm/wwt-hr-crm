import { useState } from 'react'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.non_field_errors?.[0] ||
                          'Невірний логін або пароль'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 40,
        width: 380,
      }}>
        <h1 style={{
          background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          marginBottom: 8,
          fontSize: 28,
        }}>HR CRM</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 32, fontSize: 12, letterSpacing: 2 }}>
          СИСТЕМА УПРАВЛІННЯ
        </p>

        {error && (
          <div style={{ background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Логін"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            style={{
              width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, marginBottom: 16,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, marginBottom: 24,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Завантаження...' : 'Увійти'}
          </button>
        </form>
      </div>
    </div>
  )
}
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const SIDEBAR_W = 220

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  // Всі пункти меню (адмінка завжди показується)
const navItems = [
  { id: 'dashboard', label: 'Дашборд', icon: '📊', path: '/' },
  { id: 'employees', label: 'HR Таблиця', icon: '👥', path: '/employees' },
  { id: 'hr-needs', label: 'HR Потреби', icon: '🎯', path: '/hr-needs' },
  { id: 'performance', label: 'Перформанс', icon: '⚡', path: '/performance' },
  { id: 'documents', label: 'Cookies', icon: '🍪', path: '/documents' },
  ...(user?.is_superuser ? [{ id: 'admin-panel', label: 'Адмін', icon: '⚙️', path: '/admin-panel' }] : []),
]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <aside style={{
        width: SIDEBAR_W, minWidth: SIDEBAR_W,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        padding: '24px 12px',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0,
        height: '100vh', overflowY: 'auto', zIndex: 200,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{
            fontSize: 22, fontWeight: 700,
            background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>HR CRM</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 2, marginTop: 4 }}>СИСТЕМА УПРАВЛІННЯ</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'linear-gradient(90deg, rgba(0,210,255,0.18), rgba(58,123,213,0.06))' : 'transparent',
                  borderLeft: isActive ? '3px solid #00d2ff' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            )
          })}
        </nav>

        {user && (
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user.username}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
              {user.is_superuser ? '👑 Адміністратор' : '👤 Користувач'}
            </div>
          </div>
        )}

        <div
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
            color: 'rgba(255,107,107,0.75)', fontSize: 14,
          }}
        >
          <span>🚪</span>
          <span>Вийти</span>
        </div>
      </aside>

      <main style={{
        flex: 1, marginLeft: SIDEBAR_W,
        padding: '28px 32px', minHeight: '100vh',
        color: '#fff', overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}
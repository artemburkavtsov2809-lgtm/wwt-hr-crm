import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1740, #2a2460)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 32, width: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function TeamsSection() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editTeam, setEditTeam] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['teams-admin'],
    queryFn: () => api.get('/teams/').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/teams/', d),
    onSuccess: () => { queryClient.invalidateQueries(['teams-admin']); queryClient.invalidateQueries(['teams']); setShowModal(false); setForm({ name: '', description: '' }) },
    onError: (e) => alert(JSON.stringify(e.response?.data)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/teams/${id}/`, data),
    onSuccess: () => { queryClient.invalidateQueries(['teams-admin']); queryClient.invalidateQueries(['teams']); setEditTeam(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/teams/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries(['teams-admin']); queryClient.invalidateQueries(['teams']) },
  })

  const list = data?.results || data || []

  const openEdit = (team) => {
    setEditTeam(team)
    setForm({ name: team.name, description: team.description || '' })
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>🏢 Команди</h2>
        <button onClick={() => { setShowModal(true); setForm({ name: '', description: '' }) }}
          style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Додати команду
        </button>
      </div>

      {isLoading ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', padding: 20, textAlign: 'center' }}>Завантаження...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {list.map(team => (
            <div key={team.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{team.name}</div>
                {team.description && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>{team.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(team)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,210,255,0.3)', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                <button onClick={() => { if (confirm(`Видалити команду ${team.name}?`)) deleteMutation.mutate(team.id) }}
                  style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
              </div>
            </div>
          ))}
          {list.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Немає команд — додайте першу!</div>}
        </div>
      )}

      {(showModal || editTeam) && (
        <Modal title={editTeam ? 'Редагувати команду' : 'Нова команда'} onClose={() => { setShowModal(false); setEditTeam(null) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Назва команди *</div>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="BE1, FE, QA..." />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Опис</div>
              <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Backend команда 1..." />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setShowModal(false); setEditTeam(null) }}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                Скасувати
              </button>
              <button onClick={() => editTeam ? updateMutation.mutate({ id: editTeam.id, data: form }) : createMutation.mutate(form)}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Зберегти
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function UsersSection() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', email: '', first_name: '', last_name: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['crm-users'],
    queryFn: () => api.get('/auth/users/').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/auth/users/', d),
    onSuccess: () => { queryClient.invalidateQueries(['crm-users']); setShowModal(false); setForm({ username: '', password: '', email: '', first_name: '', last_name: '' }) },
    onError: (e) => alert(JSON.stringify(e.response?.data, null, 2)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/auth/users/${id}/`),
    onSuccess: () => queryClient.invalidateQueries(['crm-users']),
  })

  const list = data?.results || data || []

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>👤 Користувачі CRM</h2>
        <button onClick={() => setShowModal(true)}
          style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Додати користувача
        </button>
      </div>

      {isLoading ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', padding: 20, textAlign: 'center' }}>Завантаження...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Логін', "Ім'я", 'Email', 'Статус', 'Дії'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>{user.username}</td>
                <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>{[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}</td>
                <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{user.email || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: user.is_active ? 'rgba(46,213,115,0.15)' : 'rgba(255,107,107,0.15)', color: user.is_active ? '#2ed573' : '#ff6b6b' }}>
                    {user.is_superuser ? '👑 Адмін' : user.is_active ? 'Активний' : 'Неактивний'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {!user.is_superuser && (
                    <button onClick={() => { if (confirm(`Видалити ${user.username}?`)) deleteMutation.mutate(user.id) }}
                      style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}>
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Немає користувачів</td></tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <Modal title="Новий користувач" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Ім'я</div>
                <input style={inputStyle} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Іван" />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Прізвище</div>
                <input style={inputStyle} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Іваненко" />
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Логін *</div>
              <input style={inputStyle} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="ivan.ivanenko" />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Email</div>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ivan@company.com" />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Пароль *</div>
              <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Мінімум 8 символів" />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                Скасувати
              </button>
              <button onClick={() => createMutation.mutate(form)}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Створити
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function Admin() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, background: 'linear-gradient(90deg, #fff, #a8edea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚙️ Адмін панель
        </h1>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Управління командами та користувачами</div>
      </div>
      <TeamsSection />
      <UsersSection />
    </div>
  )
}
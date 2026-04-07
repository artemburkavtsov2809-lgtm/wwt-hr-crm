import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

const STATUS_CONFIG = {
  onboarding: { label: 'Onboarding', color: '#00d2ff', bg: 'rgba(0,210,255,0.15)' },
  active: { label: 'Працює', color: '#2ed573', bg: 'rgba(46,213,115,0.15)' },
  vacation: { label: 'Відпустка', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  offboarding: { label: 'До офбордингу', color: '#ff9800', bg: 'rgba(255,152,0,0.15)' },
  dismissed: { label: 'Покинув команду', color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
}

const NDA_CONFIG = {
  signed: { label: 'Підписано', color: '#2ed573', bg: 'rgba(46,213,115,0.15)' },
  not_signed: { label: 'Не підписано', color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
  none: { label: '—', color: 'rgba(255,255,255,0.3)', bg: 'transparent' },
}

const RISK_CONFIG = {
  '': { label: '—', color: 'rgba(255,255,255,0.3)' },
  low: { label: 'Низький', color: '#2ed573' },
  medium: { label: 'Середній', color: '#ffc107' },
  high: { label: 'Високий', color: '#ff6b6b' },
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

const filterSelectStyle = {
  padding: '9px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
  color: '#fff', fontSize: 13, outline: 'none',
}

function Badge({ config, value }) {
  const c = config[value] || { label: value, color: '#fff', bg: 'rgba(255,255,255,0.1)' }
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1740, #2a2460)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 32, width: 580, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function EmployeeForm({ initial, teams, users, onSubmit, onClose, isLoading }) {
  const [form, setForm] = useState(initial || {
    first_name: '', last_name: '', position: '',
    team: '', status: 'active', status_details: '', email: '',
    phone: '', hire_date: '', exit_date: '', hr_responsible: '',
    recruiter: '', nda_status: 'none', risk_level: '', calendly_url: '', notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    const data = { ...form }
    if (!data.email) delete data.email
    if (!data.hire_date) delete data.hire_date
    if (!data.exit_date) delete data.exit_date
    if (!data.calendly_url) delete data.calendly_url
    onSubmit(data)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Ім'я *</div>
          <input style={inputStyle} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Іван" />
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Прізвище *</div>
          <input style={inputStyle} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Іваненко" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Посада</div>
          <input style={inputStyle} value={form.position} onChange={e => set('position', e.target.value)} placeholder="FE Developer" />
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Команда</div>
          <select style={inputStyle} value={form.team} onChange={e => set('team', e.target.value)}>
            <option value="">Оберіть команду</option>
            {teams.map(t => <option key={t.id || t} value={t.name || t}>{t.name || t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Статус</div>
          <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Деталі статусу</div>
          <input style={inputStyle} value={form.status_details} onChange={e => set('status_details', e.target.value)} placeholder="Додаткова інфо..." />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>HR відповідальний</div>
          <select style={inputStyle} value={form.hr_responsible} onChange={e => set('hr_responsible', e.target.value)}>
            <option value="">Оберіть HR</option>
            {users.map(u => (
              <option key={u.id} value={u.username}>{u.first_name} {u.last_name} ({u.username})</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Рекрутер</div>
          <select style={inputStyle} value={form.recruiter} onChange={e => set('recruiter', e.target.value)}>
            <option value="">Оберіть рекрутера</option>
            {users.map(u => (
              <option key={u.id} value={u.username}>{u.first_name} {u.last_name} ({u.username})</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>NDA</div>
          <select style={inputStyle} value={form.nda_status} onChange={e => set('nda_status', e.target.value)}>
            <option value="none">—</option>
            <option value="signed">Підписано</option>
            <option value="not_signed">Не підписано</option>
          </select>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Ризик звільнення</div>
          <select style={inputStyle} value={form.risk_level} onChange={e => set('risk_level', e.target.value)}>
            <option value="">—</option>
            <option value="low">Низький</option>
            <option value="medium">Середній</option>
            <option value="high">Високий</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Дата прийому</div>
          <input style={inputStyle} type="date" value={form.hire_date || ''} onChange={e => set('hire_date', e.target.value)} />
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Дата виходу</div>
          <input style={inputStyle} type="date" value={form.exit_date || ''} onChange={e => set('exit_date', e.target.value)} />
        </div>
      </div>

      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Email</div>
        <input style={inputStyle} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="ivan@company.com" />
      </div>

      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Calendly URL</div>
        <input style={inputStyle} value={form.calendly_url || ''} onChange={e => set('calendly_url', e.target.value)} placeholder="https://calendly.com/..." />
      </div>

      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 5 }}>Нотатки</div>
        <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
          Скасувати
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>
    </div>
  )
}

export default function Employees() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterHr, setFilterHr] = useState('')
  const [filterNda, setFilterNda] = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [showDismissed, setShowDismissed] = useState(false)

  const { data: teamsData } = useQuery({ queryKey: ['teams'], queryFn: () => api.get('/teams/').then(r => r.data) })
  
  const { data: usersData } = useQuery({ 
    queryKey: ['users'], 
    queryFn: () => api.get('/auth/users/').then(r => r.data) 
  })

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', search, filterTeam, filterStatus, filterHr, filterNda, filterRisk],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterTeam) params.append('team', filterTeam)
      if (filterStatus) params.append('status', filterStatus)
      if (filterHr) params.append('hr_responsible', filterHr)
      if (filterNda) params.append('nda_status', filterNda)
      if (filterRisk) params.append('risk_level', filterRisk)
      return api.get(`/employees/?${params}`).then(r => r.data)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/employees/', data),
    onSuccess: () => { queryClient.invalidateQueries(['employees']); setShowModal(false) },
    onError: (error) => {
      console.error('CREATE ERROR:', error.response?.data)
      alert(JSON.stringify(error.response?.data, null, 2))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/employees/${id}/`, data),
    onSuccess: () => { queryClient.invalidateQueries(['employees']); setEditEmployee(null) },
    onError: (error) => {
      const msg = error.response?.data
      alert('Помилка: ' + JSON.stringify(msg, null, 2))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}/`),
    onSuccess: () => queryClient.invalidateQueries(['employees']),
  })

  const allList = employees?.results || employees || []
  const list = showDismissed ? allList : allList.filter(e => e.status !== 'dismissed')
  const teams = teamsData?.results || teamsData || []
  const users = usersData?.results || usersData || []

  const AVATAR_COLORS = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #00d2ff, #3a7bd5)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
  ]
  const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, background: 'linear-gradient(90deg, #fff, #a8edea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          HR Таблиця
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={showDismissed} onChange={e => setShowDismissed(e.target.checked)} />
            Показати звільнених
          </label>
          <button onClick={() => setShowModal(true)} style={{ padding: '11px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            + Додати
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="🔍 Пошук по імені, посаді..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...filterSelectStyle, width: 260, borderRadius: 10 }} />
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={filterSelectStyle}>
          <option value="">Всі команди</option>
          {teams.map(t => <option key={t.id || t} value={t.name || t}>{t.name || t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterSelectStyle}>
          <option value="">Всі статуси</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterHr} onChange={e => setFilterHr(e.target.value)} style={filterSelectStyle}>
          <option value="">Всі HR</option>
          {users.map(u => (
            <option key={u.id} value={u.username}>{u.first_name} {u.last_name}</option>
          ))}
        </select>
        <select value={filterNda} onChange={e => setFilterNda(e.target.value)} style={filterSelectStyle}>
          <option value="">NDA (всі)</option>
          <option value="signed">Підписано</option>
          <option value="not_signed">Не підписано</option>
        </select>
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={filterSelectStyle}>
          <option value="">Ризик (всі)</option>
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
        {(search || filterTeam || filterStatus || filterHr || filterNda || filterRisk) && (
          <button onClick={() => { setSearch(''); setFilterTeam(''); setFilterStatus(''); setFilterHr(''); setFilterNda(''); setFilterRisk('') }}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', cursor: 'pointer', fontSize: 13 }}>
            ✕ Скинути
          </button>
        )}
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{list.length} записів</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'auto' }}>
        {isLoading ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', padding: 40, textAlign: 'center' }}>Завантаження...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                {['ID', 'Співробітник', 'Команда', 'Посада', 'Статус', 'Деталі', 'HR', 'NDA', 'Ризик', 'Дата прийому', 'Дата виходу', 'Calendly', 'Дії'].map(h => (
                  <th key={h} style={{ padding: '13px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(emp => (
                <tr key={emp.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: emp.status === 'dismissed' ? 0.6 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>#{emp.employee_id || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(emp.employee_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                        {emp.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{emp.full_name}</div>
                        {emp.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{emp.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(0,210,255,0.12)', color: '#00d2ff', whiteSpace: 'nowrap' }}>{emp.team}</span>
                  </td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>{emp.position}</td>
                  <td style={{ padding: '12px' }}><Badge config={STATUS_CONFIG} value={emp.status} /></td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 12, maxWidth: 160 }}>
                    {emp.status_details && <span title={emp.status_details}>{emp.status_details.slice(0, 30)}{emp.status_details.length > 30 ? '...' : ''}</span>}
                  </td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', fontSize: 12 }}>{emp.hr_responsible || '—'}</td>
                  <td style={{ padding: '12px' }}><Badge config={NDA_CONFIG} value={emp.nda_status || 'none'} /></td>
                  <td style={{ padding: '12px' }}>
                    {emp.risk_level ? (
                      <span style={{ color: RISK_CONFIG[emp.risk_level]?.color, fontSize: 12, fontWeight: 600 }}>
                        {RISK_CONFIG[emp.risk_level]?.label}
                      </span>
                    ) : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('uk-UA') : '—'}
                  </td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {emp.exit_date ? new Date(emp.exit_date).toLocaleDateString('uk-UA') : '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {emp.calendly_url
                      ? <a href={emp.calendly_url} target="_blank" rel="noreferrer" style={{ color: '#00d2ff', fontSize: 12, textDecoration: 'none' }}>📅 Calendly</a>
                      : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditEmployee(emp)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(0,210,255,0.3)', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                      <button onClick={() => { if (confirm(`Видалити ${emp.full_name}?`)) deleteMutation.mutate(emp.id) }} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={13} style={{ padding: 50, textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>Немає співробітників</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Новий співробітник" onClose={() => setShowModal(false)}>
          <EmployeeForm
            teams={teams} users={users}
            onClose={() => setShowModal(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        </Modal>
      )}
      {editEmployee && (
        <Modal title="Редагувати співробітника" onClose={() => setEditEmployee(null)}>
          <EmployeeForm
            initial={editEmployee} teams={teams} users={users}
            onClose={() => setEditEmployee(null)}
            onSubmit={(data) => updateMutation.mutate({ id: editEmployee.id, data })}
            isLoading={updateMutation.isPending}
          />
        </Modal>
      )}
    </div>
  )
}
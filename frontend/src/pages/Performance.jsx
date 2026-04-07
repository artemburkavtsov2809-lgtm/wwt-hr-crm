// pages/Performance.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

const SKILLS = [
  { key: 'responsibility', label: 'Відповідальність', max: 5 },
  { key: 'teamwork', label: 'Командна робота', max: 5 },
  { key: 'learning_speed', label: 'Швидкість навчання', max: 5 },
  { key: 'engineering', label: 'Інженерний підхід', max: 5 },
  { key: 'tech_skills', label: 'Тех. скіли', max: 5 },
  { key: 'availability', label: 'Час (Доступність)', max: 25 },
  { key: 'vibe', label: 'Вайб', max: 5 },
]

const inputStyle = {
  padding: '8px 12px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

// ✅ Хелпер для безпечного отримання масиву
const getArray = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (data.results && Array.isArray(data.results)) return data.results
  return []
}

function ScoreDots({ value, max, onChange }) {
  if (max === 25) {
    return (
      <input
        type="number" min="0" max="25" step="1"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        style={{ ...inputStyle, width: 70, textAlign: 'center' }}
      />
    )
  }
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <div
          key={n}
          onClick={() => onChange(value === n ? null : n)}
          style={{
            width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: value >= n ? scoreColor(value) : 'rgba(255,255,255,0.08)',
            color: value >= n ? '#fff' : 'rgba(255,255,255,0.3)',
            border: value >= n ? 'none' : '1px solid rgba(255,255,255,0.12)',
            transform: value === n ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {n}
        </div>
      ))}
    </div>
  )
}

function scoreColor(v) {
  if (!v) return 'rgba(255,255,255,0.1)'
  if (v >= 4.5) return '#2ed573'
  if (v >= 3.5) return '#00d2ff'
  if (v >= 2.5) return '#ffc107'
  if (v >= 1.5) return '#ff9800'
  return '#ff6b6b'
}

function avgScore(scores) {
  const keys = ['responsibility', 'teamwork', 'learning_speed', 'engineering', 'tech_skills', 'vibe']
  const vals = keys.map(k => scores[k]).filter(v => v !== null && v !== undefined && v !== '')
  if (!vals.length) return null
  return (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1)
}

export default function Performance() {
  const queryClient = useQueryClient()
  const [selectedTeam, setSelectedTeam] = useState('')
  const [reviewer, setReviewer] = useState('')
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0])
  const [scores, setScores] = useState({})
  const [notes, setNotes] = useState({})
  const [tab, setTab] = useState('review')
  const [filterTeam, setFilterTeam] = useState('')
  const [saved, setSaved] = useState(false)

  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get('/employees/teams/').then(r => r.data),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-active', selectedTeam],
    queryFn: () => api.get(`/employees/?team=${selectedTeam}&status=active`).then(r => r.data),
    enabled: !!selectedTeam,
  })

  const { data: onboardingEmps } = useQuery({
    queryKey: ['employees-onboarding', selectedTeam],
    queryFn: () => api.get(`/employees/?team=${selectedTeam}&status=onboarding`).then(r => r.data),
    enabled: !!selectedTeam,
  })

  const { data: history, isLoading: histLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['performance-history', filterTeam],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterTeam) params.append('team', filterTeam)
      return api.get(`/performance/?${params}`).then(r => r.data)
    },
    enabled: tab === 'history',
  })

  const { data: perfTeamsData } = useQuery({
    queryKey: ['perf-teams'],
    queryFn: () => api.get('/performance/teams/').then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (reviews) => Promise.all(reviews.map(r => api.post('/performance/', r))),
    onSuccess: () => {
      refetchHistory()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setScores({})
      setNotes({})
    },
  })

  const deleteReview = useMutation({
    mutationFn: (id) => api.delete(`/performance/${id}/`),
    onSuccess: () => refetchHistory(),
  })

  // ✅ Використовуємо getArray для ВСІХ даних
  const teams = getArray(teamsData)
  const perfTeams = getArray(perfTeamsData)
  const historyList = getArray(history)
  const allEmps = [
    ...getArray(employees),
    ...getArray(onboardingEmps),
  ]

  const setScore = (empId, skill, val) => {
    setScores(prev => ({ ...prev, [empId]: { ...(prev[empId] || {}), [skill]: val } }))
  }

  const handleSave = () => {
    if (!selectedTeam || !reviewer || !reviewDate) return alert('Заповніть команду, оцінювача і дату!')
    const reviews = allEmps
      .filter(emp => scores[emp.id] && Object.keys(scores[emp.id]).length > 0)
      .map(emp => ({
        date: reviewDate,
        reviewer,
        employee_name: emp.full_name,
        team: selectedTeam,
        ...scores[emp.id],
        notes: notes[emp.id] || '',
      }))
    if (!reviews.length) return alert('Заповніть хоча б одну оцінку!')
    saveMutation.mutate(reviews)
  }

  const handleTabChange = (newTab) => {
    setTab(newTab)
    if (newTab === 'history') {
      setTimeout(() => refetchHistory(), 100)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, background: 'linear-gradient(90deg, #fff, #a8edea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Перформанс
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['review', 'history'].map(t => (
            <button key={t} onClick={() => handleTabChange(t)} style={{
              padding: '9px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.15)',
              background: tab === t ? 'linear-gradient(135deg, #00d2ff, #3a7bd5)' : 'transparent',
              color: tab === t ? '#fff' : 'rgba(255,255,255,0.6)',
            }}>
              {t === 'review' ? '📝 Оцінювання' : '📊 Історія'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'review' && (
        <div>
          {/* Filters */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Команда</div>
              <select value={selectedTeam} onChange={e => { setSelectedTeam(e.target.value); setScores({}) }}
                style={{ ...inputStyle, minWidth: 160 }}>
                <option value="">Оберіть команду</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Хто оцінює</div>
              <input style={{ ...inputStyle, minWidth: 200 }} value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="TL / PM / HR" />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Дата</div>
              <input type="date" style={{ ...inputStyle, minWidth: 160 }} value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
            </div>
            <button onClick={handleSave} disabled={saveMutation.isPending}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginLeft: 'auto' }}>
              {saveMutation.isPending ? 'Збереження...' : '💾 Зберегти оцінки'}
            </button>
          </div>

          {saved && (
            <div style={{ background: 'rgba(46,213,115,0.15)', border: '1px solid rgba(46,213,115,0.3)', borderRadius: 12, padding: '12px 20px', marginBottom: 20, color: '#2ed573', fontSize: 14 }}>
              ✅ Оцінки збережено успішно!
            </div>
          )}

          {!selectedTeam && (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>
              Оберіть команду щоб почати оцінювання
            </div>
          )}

          {selectedTeam && allEmps.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>
              Немає активних співробітників у команді {selectedTeam}
            </div>
          )}

          {selectedTeam && allEmps.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap', minWidth: 180 }}>Співробітник</th>
                    {SKILLS.map(s => (
                      <th key={s.key} style={{ padding: '14px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap', minWidth: s.max === 25 ? 100 : 180 }}>
                        {s.label}
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>max {s.max}</div>
                      </th>
                    ))}
                    <th style={{ padding: '14px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, minWidth: 70 }}>Avg</th>
                    <th style={{ padding: '14px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, minWidth: 160 }}>Нотатки</th>
                  </tr>
                </thead>
                <tbody>
                  {allEmps.map(emp => {
                    const empScores = scores[emp.id] || {}
                    const avg = avgScore(empScores)
                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                              {emp.initials}
                            </div>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{emp.full_name}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{emp.position}</div>
                            </div>
                          </div>
                        </td>
                        {SKILLS.map(s => (
                          <td key={s.key} style={{ padding: '14px 10px', textAlign: 'center' }}>
                            <ScoreDots
                              value={empScores[s.key] ?? null}
                              max={s.max}
                              onChange={val => setScore(emp.id, s.key, val)}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                          {avg ? (
                            <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor(Number(avg)) }}>{avg}</div>
                          ) : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 10px' }}>
                          <input
                            style={inputStyle}
                            value={notes[emp.id] || ''}
                            onChange={e => setNotes(prev => ({ ...prev, [emp.id]: e.target.value }))}
                            placeholder="Коментар..."
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
              style={{ ...inputStyle, maxWidth: 200 }}>
              <option value="">Всі команди</option>
              {perfTeams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'auto' }}>
            {histLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Завантаження...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    {['Дата', 'Оцінювач', 'Співробітник', 'Команда', 'Відп.', 'Команда', 'Навч.', 'Інж.', 'Тех.', 'Час', 'Вайб', 'Avg', ''].map((h, i) => (
                      <th key={i} style={{ padding: '12px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyList.map(r => {
                    const avg = avgScore(r)
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                          {new Date(r.date).toLocaleDateString('uk-UA')}
                        </td>
                        <td style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{r.reviewer}</td>
                        <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.employee_name}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(0,210,255,0.12)', color: '#00d2ff' }}>{r.team}</span>
                        </td>
                        {['responsibility', 'teamwork', 'learning_speed', 'engineering', 'tech_skills', 'availability', 'vibe'].map(k => (
                          <td key={k} style={{ padding: '12px 10px', textAlign: 'center' }}>
                            {r[k] !== null && r[k] !== undefined
                              ? <span style={{ fontWeight: 600, color: k === 'availability' ? '#a8edea' : scoreColor(Number(r[k])) }}>{r[k]}</span>
                              : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                            }
                          </td>
                        ))}
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          {avg ? <span style={{ fontWeight: 700, color: scoreColor(Number(avg)) }}>{avg}</span> : '—'}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <button onClick={() => { if (confirm('Видалити?')) deleteReview.mutate(r.id) }}
                            style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {historyList.length === 0 && (
                    <tr><td colSpan={13} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Немає записів</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
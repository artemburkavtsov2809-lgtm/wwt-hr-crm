import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

const MONTHS = [
  { key: 'january', label: 'Січ' },
  { key: 'february', label: 'Лют' },
  { key: 'march', label: 'Бер' },
  { key: 'april', label: 'Кві' },
  { key: 'may', label: 'Тра' },
  { key: 'june', label: 'Чер' },
  { key: 'july', label: 'Лип' },
  { key: 'august', label: 'Сер' },
  { key: 'september', label: 'Вер' },
  { key: 'october', label: 'Жов' },
  { key: 'november', label: 'Лис' },
  { key: 'december', label: 'Гру' },
]

const CURRENT_MONTH = new Date().getMonth()
const CURRENT_YEAR = new Date().getFullYear()

const inputStyle = {
  padding: '9px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

export default function Documents() {
  const queryClient = useQueryClient()

  const [tab, setTab] = useState('checklist')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [filterTeam, setFilterTeam] = useState('')
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)
  const [search, setSearch] = useState('')

  // All teams from employees
  const { data: teamsData, refetch: refetchTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get('/employees/teams/').then(r => r.data),
  })

  // Active + onboarding employees
  const { 
    data: activeEmpsData, 
    isLoading: activeLoading 
  } = useQuery({
    queryKey: ['employees-active', selectedTeam],
    queryFn: () => api.get(`/employees/?team=${selectedTeam}&status=active`).then(r => r.data),
    enabled: !!selectedTeam,
  })

  const { 
    data: onboardingEmpsData, 
    isLoading: onboardingLoading 
  } = useQuery({
    queryKey: ['employees-onboarding', selectedTeam],
    queryFn: () => api.get(`/employees/?team=${selectedTeam}&status=onboarding`).then(r => r.data),
    enabled: !!selectedTeam,
  })

  // Existing cookies records — ПРАВИЛЬНИЙ ШЛЯХ /api/cookies/
  const { 
    data: existingData, 
    isLoading: existingLoading,
    refetch: refetchExisting 
  } = useQuery({
    queryKey: ['cookies', selectedTeam, selectedYear],
    queryFn: () => api.get(`/api/cookies/?team=${selectedTeam}&year=${selectedYear}`).then(r => r.data),
    enabled: !!selectedTeam,
  })

  // History — ПРАВИЛЬНИЙ ШЛЯХ /api/cookies/
  const { 
    data: historyData, 
    isLoading: histLoading 
  } = useQuery({
    queryKey: ['cookies-history', filterTeam, filterYear],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterTeam) params.append('team', filterTeam)
      if (filterYear) params.append('year', filterYear)
      return api.get(`/api/cookies/?${params}`).then(r => r.data)
    },
    enabled: tab === 'history',
  })

  const { data: cookieTeams } = useQuery({
    queryKey: ['cookies-teams'],
    queryFn: () => api.get('/api/cookies/teams/').then(r => r.data),
    enabled: tab === 'history',
  })

  // Mutations — ПРАВИЛЬНІ ШЛЯХИ /api/cookies/
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/cookies/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookies'] })
      queryClient.invalidateQueries({ queryKey: ['cookies-history'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/api/cookies/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookies'] })
      queryClient.invalidateQueries({ queryKey: ['cookies-history'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/cookies/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookies'] })
      queryClient.invalidateQueries({ queryKey: ['cookies-history'] })
    },
  })

  // Автоматичне оновлення
  useEffect(() => {
    if (selectedTeam) {
      refetchExisting()
    }
  }, [selectedTeam, selectedYear, refetchExisting])

  const refreshAllData = () => {
    refetchTeams()
    if (selectedTeam) refetchExisting()
    if (tab === 'history') {
      queryClient.invalidateQueries({ queryKey: ['cookies-history'] })
    }
  }

  const teams = teamsData || []
  const activeEmps = activeEmpsData?.results || activeEmpsData || []
  const onboardingEmps = onboardingEmpsData?.results || onboardingEmpsData || []
  const allEmps = [...activeEmps, ...onboardingEmps]
  const existing = existingData?.results || existingData || []

  // Merge employees with existing records
  const rows = allEmps.map(emp => {
    const record = existing.find(r => r.employee_name === emp.full_name)
    return { emp, record }
  })

  // Створюємо запис, якщо його немає
  const ensureRecord = async (emp) => {
    const existingRecord = existing.find(r => r.employee_name === emp.full_name)
    if (existingRecord) return existingRecord

    const res = await createMutation.mutateAsync({
      employee_name: emp.full_name,
      team: selectedTeam,
      year: selectedYear,
    })
    await refetchExisting()
    return res.data
  }

  const toggleMonth = async (emp, record, monthKey) => {
    let currentRecord = record

    if (!currentRecord) {
      currentRecord = await ensureRecord(emp)
    }

    const newValue = !currentRecord[monthKey]

    updateMutation.mutate({
      id: currentRecord.id,
      data: { [monthKey]: newValue }
    })
  }

  // History
  const histList = historyData?.results || historyData || []
  const filteredHist = search 
    ? histList.filter(i => i.employee_name?.toLowerCase().includes(search.toLowerCase())) 
    : histList

  const currentMonthKey = MONTHS[CURRENT_MONTH]?.key
  const currentMonthDone = rows.filter(({ record }) => record?.[currentMonthKey]).length

  const isLoading = selectedTeam && (activeLoading || onboardingLoading || existingLoading)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, background: 'linear-gradient(90deg, #fff, #a8edea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🍪 Cookies Checklist
          </h1>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Щомісячні виплати</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={refreshAllData} 
            style={{
              padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            🔄 Оновити
          </button>

          {['checklist', 'history'].map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t)} 
              style={{
                padding: '9px 20px', 
                borderRadius: 10, 
                cursor: 'pointer', 
                fontSize: 13, 
                fontWeight: 600,
                border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.15)',
                background: tab === t ? 'linear-gradient(135deg, #00d2ff, #3a7bd5)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            >
              {t === 'checklist' ? '✅ Чекліст' : '📊 Всі записи'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'checklist' && (
        <div>
          {/* Filters */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Команда</div>
              <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
                <option value="">Оберіть команду</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Рік</div>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={inputStyle}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {selectedTeam && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#2ed573' }}>
                    {currentMonthDone}/{rows.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>цього місяця</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#00d2ff' }}>{rows.length}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>всього осіб</div>
                </div>
              </div>
            )}
          </div>

          {!selectedTeam && (
            <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>
              🍪 Оберіть команду щоб побачити чекліст
            </div>
          )}

          {isLoading && (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>
              ⏳ Завантаження даних...
            </div>
          )}

          {selectedTeam && !isLoading && rows.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>
              Немає активних співробітників у команді {selectedTeam}
            </div>
          )}

          {selectedTeam && !isLoading && rows.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', minWidth: 200 }}>Співробітник</th>
                    {MONTHS.map((m, i) => (
                      <th key={m.key} style={{
                        padding: '12px 6px',
                        textAlign: 'center',
                        fontSize: 11,
                        minWidth: 44,
                        color: i === CURRENT_MONTH ? '#00d2ff' : 'rgba(255,255,255,0.45)',
                        fontWeight: i === CURRENT_MONTH ? 700 : 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        {m.label}
                      </th>
                    ))}
                    <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', minWidth: 60 }}>Разом</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ emp, record }) => (
                    <tr 
                      key={emp.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                            {emp.initials}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{emp.full_name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{emp.position}</div>
                          </div>
                        </div>
                      </td>

                      {MONTHS.map((m, i) => {
                        const checked = record?.[m.key] || false
                        return (
                          <td 
                            key={m.key} 
                            style={{
                              padding: '10px 6px',
                              textAlign: 'center',
                              background: i === CURRENT_MONTH ? 'rgba(0,210,255,0.03)' : 'transparent',
                            }}
                          >
                            <div
                              onClick={() => toggleMonth(emp, record, m.key)}
                              style={{
                                width: 30, 
                                height: 30, 
                                borderRadius: 8, 
                                cursor: 'pointer',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                margin: '0 auto',
                                transition: 'all 0.15s',
                                background: checked ? 'rgba(46,213,115,0.2)' : 'rgba(255,255,255,0.04)',
                                border: checked ? '1px solid rgba(46,213,115,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                color: checked ? '#2ed573' : 'rgba(255,255,255,0.15)',
                                fontSize: 16,
                                pointerEvents: updateMutation.isPending ? 'none' : 'auto',
                                opacity: updateMutation.isPending ? 0.6 : 1,
                              }}
                            >
                              {checked ? '✓' : ''}
                            </div>
                          </td>
                        )
                      })}

                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: !record ? 'rgba(255,255,255,0.2)' :
                            record.total_checked >= 10 ? '#2ed573' :
                            record.total_checked >= 6 ? '#ffc107' :
                            record.total_checked > 0 ? '#ff9800' : 'rgba(255,255,255,0.3)',
                        }}>
                          {record?.total_checked || 0}/12
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input 
              placeholder="🔍 Пошук..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ ...inputStyle, width: 220 }} 
            />
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={inputStyle}>
              <option value="">Всі команди</option>
              {(cookieTeams || []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={inputStyle}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'auto' }}>
            {histLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Завантаження...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', minWidth: 180 }}>Ім'я</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', minWidth: 70 }}>Відділ</th>
                    {MONTHS.map((m, i) => (
                      <th key={m.key} style={{
                        padding: '12px 6px',
                        textAlign: 'center',
                        fontSize: 11,
                        minWidth: 40,
                        color: i === CURRENT_MONTH ? '#00d2ff' : 'rgba(255,255,255,0.45)',
                        fontWeight: i === CURRENT_MONTH ? 700 : 600,
                        textTransform: 'uppercase',
                      }}>
                        {m.label}
                      </th>
                    ))}
                    <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 11, minWidth: 60 }}>Разом</th>
                    <th style={{ minWidth: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHist.map(item => (
                    <tr 
                      key={item.id} 
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 16px', color: '#fff', fontWeight: 500 }}>{item.employee_name}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'rgba(0,210,255,0.12)', color: '#00d2ff' }}>
                          {item.team}
                        </span>
                      </td>
                      {MONTHS.map((m, i) => (
                        <td 
                          key={m.key} 
                          style={{ 
                            padding: '10px 6px', 
                            textAlign: 'center', 
                            background: i === CURRENT_MONTH ? 'rgba(0,210,255,0.03)' : 'transparent' 
                          }}
                        >
                          <span style={{ color: item[m.key] ? '#2ed573' : 'rgba(255,255,255,0.15)', fontSize: 16 }}>
                            {item[m.key] ? '✓' : '·'}
                          </span>
                        </td>
                      ))}
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: item.total_checked >= 10 ? '#2ed573' : 
                                 item.total_checked >= 6 ? '#ffc107' : '#ff9800' 
                        }}>
                          {item.total_checked}/12
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button 
                          onClick={() => { 
                            if (confirm(`Видалити ${item.employee_name}?`)) 
                              deleteMutation.mutate(item.id) 
                          }}
                          style={{ 
                            padding: '4px 10px', 
                            borderRadius: 8, 
                            border: '1px solid rgba(255,107,107,0.3)', 
                            background: 'rgba(255,107,107,0.1)', 
                            color: '#ff6b6b', 
                            cursor: 'pointer', 
                            fontSize: 12 
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredHist.length === 0 && (
                    <tr>
                      <td colSpan={15} style={{ padding: 50, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                        Немає записів
                      </td>
                    </tr>
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
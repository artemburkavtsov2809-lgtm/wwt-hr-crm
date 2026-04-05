import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { StatusBadge } from '../utils/statuses.jsx'

function StatCard({ icon, label, value, change, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: 28, transition: 'all 0.3s', cursor: 'default',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-6px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        width: 50, height: 50, borderRadius: 14, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 24,
        background: `rgba(${color}, 0.15)`, marginBottom: 18,
      }}>{icon}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{
        fontSize: 36, fontWeight: 700, marginBottom: 12,
        background: 'linear-gradient(90deg, #fff, #a8edea)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{value}</div>
      {change && (
        <div style={{
          fontSize: 13, padding: '6px 12px', borderRadius: 20, display: 'inline-flex',
          alignItems: 'center', gap: 5,
          background: change > 0 ? 'rgba(46,213,115,0.15)' : 'rgba(255,107,107,0.15)',
          color: change > 0 ? '#2ed573' : '#ff6b6b',
        }}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: () => api.get('/employees/stats/').then(r => r.data),
  })

  const { data: employees, isLoading: empLoading } = useQuery({
    queryKey: ['employees-recent'],
    queryFn: () => api.get('/employees/?ordering=-created_at').then(r => r.data),
  })

  const { data: hrNeeds } = useQuery({
    queryKey: ['hr-needs-open'],
    queryFn: () => api.get('/hr-needs/?status=open').then(r => r.data),
  })

  if (statsLoading || empLoading) return (
    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, paddingTop: 40 }}>Завантаження...</div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 35 }}>
        <h1 style={{
          fontSize: 34, fontWeight: 700,
          background: 'linear-gradient(90deg, #fff, #a8edea)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Дашборд</h1>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>
          {new Date().toLocaleDateString('uk-UA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 25, marginBottom: 35 }}>
        <StatCard icon="👥" label="Всього" value={stats?.total ?? 0} color="0, 210, 255" />
        <StatCard icon="✅" label="Працює" value={stats?.active ?? 0} color="46, 213, 115" />
        <StatCard icon="🚀" label="Onboarding" value={stats?.onboarding ?? 0} color="0, 210, 255" />
        <StatCard icon="🏖️" label="Відпустка" value={stats?.on_vacation ?? 0} color="255, 193, 7" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 25 }}>
        {/* Recent employees */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#fff' }}>👥 Останні співробітники</h2>
          {employees?.results?.length === 0 || employees?.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Немає даних</div>
          ) : (
            (employees?.results || employees || []).slice(0, 5).map((emp) => (
              <div key={emp.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, color: '#fff',
                }}>
                  {emp.initials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{emp.full_name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{emp.position}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: emp.status === 'active' ? 'rgba(46,213,115,0.15)' : 'rgba(255,193,7,0.15)',
                    color: emp.status === 'active' ? '#2ed573' : '#ffc107',
                  }}>
                    {emp.status === 'active' ? 'Активний' : emp.status === 'vacation' ? 'Відпустка' : emp.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Open HR Needs */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#fff' }}>🎯 Відкриті вакансії</h2>
          {(hrNeeds?.results || hrNeeds || []).length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Немає відкритих вакансій</div>
          ) : (
            (hrNeeds?.results || hrNeeds || []).slice(0, 5).map((need) => (
              <div key={need.id} style={{
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{need.title}</div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: need.priority === 'high' ? 'rgba(255,107,107,0.15)' : need.priority === 'critical' ? 'rgba(255,0,0,0.2)' : 'rgba(255,193,7,0.15)',
                    color: need.priority === 'high' ? '#ff6b6b' : need.priority === 'critical' ? '#ff4444' : '#ffc107',
                  }}>
                    {need.priority === 'high' ? 'Високий' : need.priority === 'critical' ? 'Критичний' : need.priority === 'medium' ? 'Середній' : 'Низький'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{need.team}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
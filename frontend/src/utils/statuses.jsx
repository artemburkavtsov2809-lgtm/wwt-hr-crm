export const EMPLOYEE_STATUSES = {
  onboarding: { label: 'Onboarding', color: '#00d2ff', bg: 'rgba(0,210,255,0.15)' },
  active: { label: 'Працює', color: '#2ed573', bg: 'rgba(46,213,115,0.15)' },
  vacation: { label: 'Відпустка', color: '#ffc107', bg: 'rgba(255,193,7,0.15)' },
  offboarding: { label: 'До офбордингу', color: '#ff9800', bg: 'rgba(255,152,0,0.15)' },
  dismissed: { label: 'Покинув команду', color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
}

export function StatusBadge({ status }) {
  const s = EMPLOYEE_STATUSES[status] || { label: status, color: '#fff', bg: 'rgba(255,255,255,0.1)' }
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}
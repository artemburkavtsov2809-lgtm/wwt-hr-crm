import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

const PRIORITIES = ['low', 'medium', 'high', 'critical']
const PRIORITY_LABELS = { low: 'Низький', medium: 'Середній', high: 'Високий', critical: 'Критичний' }
const PRIORITY_COLORS = {
  low: { color: '#2ed573', bg: 'rgba(46,213,115,0.15)' },
  medium: { color: '#ffc107', bg: 'rgba(255,193,7,0.15)' },
  high: { color: '#ff9800', bg: 'rgba(255,152,0,0.15)' },
  critical: { color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
}

const STATUSES = ['open', 'in_progress', 'on_hold', 'closed']
const STATUS_LABELS = { open: 'Відкрита', in_progress: 'В процесі', on_hold: 'На паузі', closed: 'Закрита' }
const STATUS_COLORS = {
  open: { color: '#2ed573', bg: 'rgba(46,213,115,0.15)' },
  in_progress: { color: '#00d2ff', bg: 'rgba(0,210,255,0.15)' },
  on_hold: { color: '#ffc107', bg: 'rgba(255,193,7,0.15)' },
  closed: { color: '#888', bg: 'rgba(255,255,255,0.08)' },
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

function Badge({ value, map, colorMap }) {
  const label = map[value] || value
  const style = colorMap[value] || { color: '#fff', bg: 'rgba(255,255,255,0.1)' }
  return (
    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: style.bg, color: style.color }}>
      {label}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1740, #2a2460)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function NeedForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(initial || {
    title: '', team: '', priority: 'medium', status: 'open',
    description: '', required_count: 1, deadline: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Назва вакансії</div>
        <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Frontend Developer" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Команда</div>
          <input style={inputStyle} value={form.team} onChange={e => set('team', e.target.value)} placeholder="Development" />
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Кількість</div>
          <input style={inputStyle} type="number" min="1" value={form.required_count} onChange={e => set('required_count', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Пріоритет</div>
          <select style={inputStyle} value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Статус</div>
          <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Дедлайн</div>
        <input style={inputStyle} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
      </div>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Опис</div>
        <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Вимоги до кандидата..." />
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
          Скасувати
        </button>
        <button onClick={() => onSubmit(form)} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Зберегти
        </button>
      </div>
    </div>
  )
}

export default function HrNeeds() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editNeed, setEditNeed] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['hr-needs', filterStatus, filterPriority],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterPriority) params.append('priority', filterPriority)
      return api.get(`/hr-needs/?${params}`).then(r => r.data)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/hr-needs/', data),
    onSuccess: () => { queryClient.invalidateQueries(['hr-needs']); setShowModal(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/hr-needs/${id}/`, data),
    onSuccess: () => { queryClient.invalidateQueries(['hr-needs']); setEditNeed(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/hr-needs/${id}/`),
    onSuccess: () => queryClient.invalidateQueries(['hr-needs']),
  })

  const list = data?.results || data || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, background: 'linear-gradient(90deg, #fff, #a8edea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          HR Потреби
        </h1>
        <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          + Додати вакансію
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none', minWidth: 180 }}>
          <option value="">Всі статуси</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none', minWidth: 180 }}>
          <option value="">Всі пріоритети</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', padding: 40, textAlign: 'center' }}>Завантаження...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {list.map(need => (
            <div key={need.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0, flex: 1 }}>{need.title}</h3>
                <Badge value={need.priority} map={PRIORITY_LABELS} colorMap={PRIORITY_COLORS} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <Badge value={need.status} map={STATUS_LABELS} colorMap={STATUS_COLORS} />
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(0,210,255,0.15)', color: '#00d2ff' }}>
                  {need.team}
                </span>
              </div>
              {need.description && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.5 }}>
                  {need.description.slice(0, 100)}{need.description.length > 100 ? '...' : ''}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  👤 {need.required_count} особ{need.required_count === 1 ? 'а' : 'и'}
                  {need.deadline && ` · до ${new Date(need.deadline).toLocaleDateString('uk-UA')}`}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditNeed(need)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(0,210,255,0.3)', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                  <button onClick={() => { if (confirm(`Видалити "${need.title}"?`)) deleteMutation.mutate(need.id) }} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 60, fontSize: 16 }}>
              Немає вакансій
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal title="Нова вакансія" onClose={() => setShowModal(false)}>
          <NeedForm onClose={() => setShowModal(false)} onSubmit={(data) => createMutation.mutate(data)} />
        </Modal>
      )}
      {editNeed && (
        <Modal title="Редагувати вакансію" onClose={() => setEditNeed(null)}>
          <NeedForm initial={editNeed} onClose={() => setEditNeed(null)} onSubmit={(data) => updateMutation.mutate({ id: editNeed.id, data })} />
        </Modal>
      )}
    </div>
  )
}
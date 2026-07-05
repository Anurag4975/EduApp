'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  type: string
  start_date: string
  end_date?: string | null
  color?: string | null
  users?: { full_name: string; role: string } | null
  courses?: { title: string } | null
  is_assignment?: boolean
}

function typeColor(type: string, color?: string | null) {
  if (color && !color.startsWith('#6366f1')) return color
  switch (type) {
    case 'exam': return '#dc2626'
    case 'class': return '#6366f1'
    case 'holiday': return '#16a34a'
    case 'announcement': return '#8b5cf6'
    case 'assignment_due': return '#f59e0b'
    default: return '#6b7280'
  }
}

function typeIcon(type: string) {
  switch (type) {
    case 'exam': return '📝'
    case 'class': return '📚'
    case 'holiday': return '🎉'
    case 'announcement': return '📢'
    case 'assignment_due': return '⏰'
    default: return '📅'
  }
}

function generateGoogleCalendarUrl(event: CalendarEvent) {
  const fmt = (d: string) =>
    new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const start = fmt(event.start_date)
  const end = event.end_date ? fmt(event.end_date) : fmt(event.start_date)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarView({
  events,
  canCreate,
  userRole,
}: {
  events: CalendarEvent[]
  canCreate: boolean
  userRole: string
}) {
  const router = useRouter()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'announcement' | 'exam' | 'class' | 'holiday' | 'other'>('announcement')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function getEventsForDay(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.start_date.startsWith(dateStr))
  }

  function getSelectedDayEvents() {
    if (!selectedDate) return []
    return events.filter((e) => e.start_date.startsWith(selectedDate))
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }

  function handleDayClick(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr === selectedDate ? null : dateStr)
    setShowForm(false)
  }

  async function handleSave() {
    if (!title.trim() || !startDate) {
      setError('Title and start date are required.')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, type, startDate, endDate }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error ?? 'Failed to create event.')
      setSaving(false)
      return
    }

    setTitle('')
    setDescription('')
    setType('announcement')
    setStartDate('')
    setEndDate('')
    setShowForm(false)
    setSaving(false)
    router.refresh()
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear()

  const selectedEvents = getSelectedDayEvents()

  return (
    <div style={{ maxWidth: '1100px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Calendar</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Events, exams, and assignment due dates
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setShowForm(true); setSelectedDate(null) }}
            style={{
              padding: '10px 18px',
              backgroundColor: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            + Create Event
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { type: 'announcement', label: 'Announcement' },
          { type: 'exam', label: 'Exam' },
          { type: 'class', label: 'Class' },
          { type: 'holiday', label: 'Holiday' },
          { type: 'assignment_due', label: 'Assignment Due' },
        ].map((item) => (
          <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: typeColor(item.type) }} />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Calendar Grid */}
        <div style={{ flex: 1, minWidth: '500px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>

          {/* Month Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <button
              onClick={prevMonth}
              style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ←
            </button>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              →
            </button>
          </div>

          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f3f4f6' }}>
            {DAYS.map((d) => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const dayEvents = day ? getEventsForDay(day) : []
              const dateStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
              const isSelected = dateStr === selectedDate
              const isTodayCell = day ? isToday(day) : false

              return (
                <div
                  key={i}
                  onClick={() => day && handleDayClick(day)}
                  style={{
                    minHeight: '80px',
                    padding: '6px',
                    borderRight: (i + 1) % 7 !== 0 ? '1px solid #f9fafb' : 'none',
                    borderBottom: i < cells.length - 7 ? '1px solid #f9fafb' : 'none',
                    backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                    cursor: day ? 'pointer' : 'default',
                  }}
                >
                  {day && (
                    <>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isTodayCell ? '#6366f1' : 'transparent',
                        color: isTodayCell ? '#ffffff' : '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: isTodayCell ? '700' : '400',
                        marginBottom: '4px',
                      }}>
                        {day}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            style={{
                              backgroundColor: typeColor(e.type, e.color),
                              borderRadius: '4px',
                              padding: '2px 5px',
                              fontSize: '10px',
                              color: '#ffffff',
                              fontWeight: '600',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: '10px', color: '#9ca3af', paddingLeft: '2px' }}>
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Side Panel — Selected Day or Create Form */}
        <div style={{ width: '280px', flexShrink: 0 }}>

          {/* Create Event Form */}
          {showForm && canCreate && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>New Event</h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px' }}>×</button>
              </div>

              {/* Type pills */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {(['announcement', 'exam', 'class', 'holiday', 'other'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      border: '1.5px solid',
                      borderColor: type === t ? typeColor(t) : '#e5e7eb',
                      backgroundColor: type === t ? typeColor(t) : '#ffffff',
                      color: type === t ? '#ffffff' : '#6b7280',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box' }}
              />

              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                style={{ padding: '8px 12px', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Start *</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px' }}>End (optional)</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {error && <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '9px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Create Event'}
              </button>
            </div>
          )}

          {/* Selected Day Events */}
          {selectedDate && !showForm && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                  {selectedEvents.length === 0 ? 'No events' : `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''}`}
                </p>
              </div>

              <div style={{ padding: '12px' }}>
                {selectedEvents.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                    No events on this day
                  </p>
                ) : (
                  selectedEvents.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #f3f4f6',
                        borderLeft: `3px solid ${typeColor(e.type, e.color)}`,
                        marginBottom: '8px',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {typeIcon(e.type)} {e.title}
                          </p>
                          {e.description && (
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                              {e.description}
                            </p>
                          )}
                          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                            {new Date(e.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {e.users && ` · ${e.users.full_name}`}
                          </p>
                        </div>
                          <a
                          href={generateGoogleCalendarUrl(e)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Add to Google Calendar"
                          style={{ fontSize: '14px', textDecoration: 'none', opacity: 0.5, marginLeft: '8px' }}
                        >
                          🗓️
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default hint */}
          {!selectedDate && !showForm && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                Click any date to see events
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
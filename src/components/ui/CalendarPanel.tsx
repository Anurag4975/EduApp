'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  type: string
  start_date: string
  end_date?: string | null
  color?: string | null
  course_id?: string | null
  is_assignment?: boolean
  users?: { full_name: string; role: string } | null
  courses?: { title: string } | null
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

function typeColor(type: string, color?: string | null) {
  if (color) return color
  switch (type) {
    case 'exam': return '#dc2626'
    case 'class': return '#6366f1'
    case 'holiday': return '#16a34a'
    case 'announcement': return '#8b5cf6'
    case 'assignment_due': return '#f59e0b'
    default: return '#6b7280'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function groupByDate(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {}
  events.forEach((e) => {
    const date = new Date(e.start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(e)
  })
  return groups
}

export default function CalendarPanel({
  events: initialEvents,
  canCreate,
}: {
  events: CalendarEvent[]
  canCreate: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [events, setEvents] = useState(initialEvents)
  const panelRef = useRef<HTMLDivElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'announcement' | 'exam' | 'class' | 'holiday' | 'other'>('announcement')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowForm(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayEvents = events.filter((e) => {
    const d = new Date(e.start_date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })

  const upcomingEvents = events.filter((e) => {
    const d = new Date(e.start_date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() > today.getTime()
  })

  const grouped = groupByDate(upcomingEvents)

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

    // Add new event to local state
    setEvents((prev) => [...prev, data.event].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    ))

    // Reset form
    setTitle('')
    setDescription('')
    setType('announcement')
    setStartDate('')
    setEndDate('')
    setShowForm(false)
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      {/* Calendar Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'relative',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '50%',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        title="Calendar & Events"
      >
        📅
        {todayEvents.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            backgroundColor: '#6366f1',
            color: '#fff',
            fontSize: '10px',
            fontWeight: '700',
            minWidth: '16px',
            height: '16px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          }}>
            {todayEvents.length}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 200,
        }} />
      )}

      {/* Slide-in Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          backgroundColor: '#ffffff',
          zIndex: 201,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Panel Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {showForm ? 'New Event' : 'Calendar'}
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0 0' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {canCreate && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                + Event
              </button>
            )}
            {showForm && (
              <button
                onClick={() => { setShowForm(false); setError('') }}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => { setOpen(false); setShowForm(false) }}
              style={{
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#6b7280',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Create Event Form */}
        {showForm ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Event Type Pills */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '8px' }}>
                Event Type
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['announcement', 'exam', 'class', 'holiday', 'other'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1.5px solid',
                      borderColor: type === t ? typeColor(t) : '#e5e7eb',
                      backgroundColor: type === t ? typeColor(t) : '#ffffff',
                      color: type === t ? '#ffffff' : '#6b7280',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {typeIcon(t)} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '6px' }}>
                Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Mid-term Exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                placeholder="Details about this event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Start Date */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '6px' }}>
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '6px' }}>
                End Date & Time (optional)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '11px',
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Create Event'}
            </button>
          </div>
        ) : (
          /* Events List */
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Today */}
            <div style={{ padding: '16px 20px 8px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
                Today
              </p>
              {todayEvents.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No events today</p>
              ) : (
                todayEvents.map((e) => <EventCard key={e.id} event={e} />)
              )}
            </div>

            <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '8px 0' }} />

            {/* Upcoming */}
            <div style={{ padding: '8px 20px 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
                Upcoming
              </p>
              {Object.keys(grouped).length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No upcoming events</p>
              ) : (
                Object.entries(grouped).map(([date, dayEvents]) => (
                  <div key={date} style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
                      {date}
                    </p>
                    {dayEvents.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function EventCard({ event }: { event: CalendarEvent }) {
  const color = typeColor(event.type, event.color)

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: '10px',
      border: '1px solid #f3f4f6',
      backgroundColor: '#fafafa',
      marginBottom: '8px',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px' }}>{typeIcon(event.type)}</span>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
              {event.title}
            </p>
          </div>
          {event.description && (
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>
              {event.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
              {formatDate(event.start_date)}
            </p>
            {event.users && (
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                · {event.users.full_name}
              </p>
            )}
            {event.courses && (
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                · {event.courses.title}
              </p>
            )}
          </div>
        </div>

        <a
          href={generateGoogleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          title="Add to Google Calendar"
          style={{ flexShrink: 0, fontSize: '16px', textDecoration: 'none', opacity: 0.6 }}
          onClick={(e) => e.stopPropagation()}
        >
          🗓️
        </a>
      </div>
    </div>
  )
}
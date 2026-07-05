'use client'

import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string | null
  type: string
  link: string | null
  is_read: boolean
  created_at: string
}

function typeIcon(type: string) {
  switch (type) {
    case 'assignment_submitted': return '📤'
    case 'assignment_graded': return '📊'
    case 'assignment_created': return '📝'
    case 'quiz_completed': return '🎯'
    case 'quiz_created': return '❓'
    case 'lesson_created': return '🎥'
    case 'student_enrolled': return '🎓'
    default: return '🔔'
  }
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsPageClient({
  notifications,
}: {
  notifications: Notification[]
}) {
  const router = useRouter()

  function handleClick(n: Notification) {
    if (n.link) router.push(n.link)
  }

  return (
    <div style={{ maxWidth: '700px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Notifications
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          {notifications.length} total
        </p>
      </div>

      {notifications.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #f3f4f6',
                cursor: n.link ? 'pointer' : 'default',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{typeIcon(n.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                  {n.title}
                </p>
                {n.message && (
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    {n.message}
                  </p>
                )}
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0 0' }}>
                  {timeAgo(n.created_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
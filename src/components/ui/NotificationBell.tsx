'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string |null
  type: string
  link: string |null
  is_read: boolean
  created_at: string
}

function typeIcon(type: string) {
  switch (type) {
    case 'assignment_submitted':
      return '📤'
    case 'assignment_graded':
      return '📊'
    case 'assignment_created':
      return '📝'
    case 'quiz_completed':
      return '🎯'
    case 'quiz_created':
      return '❓'
    case 'lesson_created':
      return '🎥'
    case 'student_enrolled':
      return '🎓'
    default:
      return '🔔'
  }
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell({
  initialCount,
  initialNotifications,
  userId,
}: {
  initialCount: number
  initialNotifications: Notification[]
  userId: string
}) {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [notifications, setNotifications] = useState(initialNotifications)

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  async function handleOpen() {
    setOpen(true)

    if (count > 0) {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
      })

      setCount(0)

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        }))
      )
    }
  }

  function handleNotificationClick(n: Notification) {
    setOpen(false)

    if (n.link) {
      router.push(n.link)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title="Notifications"
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
      >
        🔔

        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: '#dc2626',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 200,
          }}
        />
      )}

      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          background: '#fff',
          zIndex: 201,
          boxShadow: '-4px 0 24px rgba(0,0,0,.12)',
          display: 'flex',
          flexDirection: 'column',
          transform: open
            ? 'translateX(0)'
            : 'translateX(100%)',
          transition: 'transform .25s ease',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              Notifications
            </h2>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: '#9ca3af',
              }}
            >
              {notifications.length === 0
                ? 'No notifications'
                : `${notifications.length} total`}
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '40px',
                  marginBottom: '12px',
                }}
              >
                🔔
              </div>

              <p
                style={{
                  color: '#9ca3af',
                }}
              >
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '12px',
                  textAlign: 'left',
                  border: 'none',
                  cursor: n.link ? 'pointer' : 'default',
                  background: n.is_read
                    ? '#fff'
                    : '#f5f3ff',
                  borderBottom:
                    i < notifications.length - 1
                      ? '1px solid #f3f4f6'
                      : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: n.is_read
                      ? '#f3f4f6'
                      : '#ede9fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {typeIcon(n.type)}
                </div>

                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    {n.title}
                  </p>

                  {n.message && (
                    <p
                      style={{
                        margin: '4px 0',
                        color: '#6b7280',
                        fontSize: '12px',
                      }}
                    >
                      {n.message}
                    </p>
                  )}

                  <p
                    style={{
                      margin: 0,
                      color: '#9ca3af',
                      fontSize: '11px',
                    }}
                  >
                    {mounted ? timeAgo(n.created_at) : ''}
                  </p>
                </div>

                {!n.is_read && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#6366f1',
                      marginTop: 6,
                    }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
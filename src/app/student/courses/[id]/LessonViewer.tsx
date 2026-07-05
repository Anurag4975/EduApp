'use client'

import { useState, useTransition } from 'react'
import { toggleLessonComplete } from '../actions'

interface Lesson {
  id: string
  title: string
  type: string
  content_url: string | null
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export default function LessonViewer({
  modules,
  courseId,
  completedLessonIds,
}: {
  modules: Module[]
  courseId: string
  completedLessonIds: string[]
}) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedLessonIds))
  const [isPending, startTransition] = useTransition()

  function handleToggle(lesson: Lesson) {
    const isCompleted = completed.has(lesson.id)

    // Optimistic update
    setCompleted((prev) => {
      const next = new Set(prev)
      isCompleted ? next.delete(lesson.id) : next.add(lesson.id)
      return next
    })

    startTransition(async () => {
      await toggleLessonComplete(lesson.id, courseId, isCompleted)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Video Player */}
      {activeLesson && activeLesson.type === 'video' && activeLesson.content_url && (
        <div
          style={{
            backgroundColor: '#000',
            borderRadius: '14px',
            overflow: 'hidden',
            position: 'sticky',
            top: '16px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#111827',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: 600 }}>
              🎥 {activeLesson.title}
            </span>
            <button
              onClick={() => setActiveLesson(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <video
            key={activeLesson.id}
            controls
            autoPlay
            style={{ width: '100%', maxHeight: '450px', display: 'block' }}
            src={activeLesson.content_url}
            onEnded={() => {
              if (!completed.has(activeLesson.id)) {
                handleToggle(activeLesson)
              }
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Modules */}
      {modules.map((module, mIndex) => (
        <div
          key={module.id}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #f3f4f6',
            overflow: 'hidden',
          }}
        >
          {/* Module Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Module {mIndex + 1}: {module.title}
            </h3>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {module.lessons.filter((l) => completed.has(l.id)).length}/{module.lessons.length}{' '}
              done
            </span>
          </div>

          {/* Lessons */}
          <div style={{ padding: '8px 20px' }}>
            {module.lessons.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', padding: '12px 0' }}>
                No lessons yet.
              </p>
            ) : (
              module.lessons.map((lesson, lIndex) => {
                const isActive = activeLesson?.id === lesson.id
                const isCompleted = completed.has(lesson.id)

                return (
                  <div
                    key={lesson.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom:
                        lIndex < module.lessons.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}
                  >
                    {/* Complete Toggle */}
                    <button
                      onClick={() => handleToggle(lesson)}
                      disabled={isPending}
                      title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: `2px solid ${isCompleted ? '#16a34a' : '#d1d5db'}`,
                        backgroundColor: isCompleted ? '#16a34a' : '#ffffff',
                        color: '#ffffff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isCompleted ? '✓' : ''}
                    </button>

                    {/* Icon */}
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>
                      {lesson.type === 'video'
                        ? '🎥'
                        : lesson.type === 'document'
                        ? '📄'
                        : '📝'}
                    </span>

                    {/* Title */}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '14px',
                          margin: 0,
                          fontWeight: 500,
                          color: isCompleted
                            ? '#9ca3af'
                            : isActive
                            ? '#6366f1'
                            : '#374151',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        {lesson.title}
                      </p>
                    </div>

                    {/* Action */}
                    {lesson.content_url && (
                      <>
                        {lesson.type === 'video' ? (
                          <button
                            onClick={() => setActiveLesson(isActive ? null : lesson)}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: isActive ? '#eef2ff' : '#6366f1',
                              color: isActive ? '#6366f1' : '#fff',
                              border: isActive ? '1.5px solid #6366f1' : 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              flexShrink: 0,
                            }}
                          >
                            {isActive ? 'Playing' : 'Play'}
                          </button>
                        ) : (
                          <a
                            href={lesson.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '13px',
                              color: '#6366f1',
                              textDecoration: 'none',
                              fontWeight: 500,
                              flexShrink: 0,
                            }}
                          >
                            Open →
                          </a>
                        )}
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
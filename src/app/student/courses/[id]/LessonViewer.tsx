'use client'

import { useState, useTransition } from 'react'
import { toggleLessonComplete } from '../actions'
import SecureVideoPlayer from '@/components/ui/SecureVideoPlayer'

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

// Fixed: Added studentEmail, studentName, and completedLessonIds to the props interface
interface LessonViewerProps {
  modules: Module[]
  courseId: string
  completedLessonIds: string[]
  studentEmail: string
  studentName: string
}

export default function LessonViewer({
  modules,
  courseId,
  completedLessonIds,
  studentEmail,
  studentName,
}: LessonViewerProps) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
      
      {/* Sidebar Navigation */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {modules.map((module) => (
          <div key={module.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>{module.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {module.lessons.map((lesson) => {
                const isSelected = activeLesson?.id === lesson.id
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      color: isSelected ? '#2563eb' : '#4b5563',
                      fontWeight: isSelected ? '600' : '500',
                      fontSize: '13px',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    {lesson.type === 'video' ? '📹 ' : '📄 '}
                    {lesson.title}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Primary Content Window */}
      <div style={{ flex: '2', minWidth: '0' }}>
        {activeLesson ? (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
              {activeLesson.title}
            </h2>
            
            {/* Fixed: Added fallback guard checking that content_url is valid, and supplied all required player props */}
            {activeLesson.type === 'video' && activeLesson.content_url ? (
              <SecureVideoPlayer
                src={activeLesson.content_url}
                lessonId={activeLesson.id}
                courseId={courseId}
                studentEmail={studentEmail}
                studentName={studentName}
                completedLessonIds={completedLessonIds}
              />
            ) : activeLesson.type === 'video' ? (
              <div style={{ padding: '40px', backgroundColor: '#f3f4f6', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>Video URL is missing or unavailable for this lesson.</p>
              </div>
            ) : (
              <div style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: '#374151' }}>This lesson is a document/text assignment.</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '60px 40px', textAlign: 'center', border: '2px dashed #e5e7eb', borderRadius: '12px', color: '#9ca3af' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>Select a lesson from the panel to start learning.</p>
          </div>
        )}
      </div>
    </div>
  )
}
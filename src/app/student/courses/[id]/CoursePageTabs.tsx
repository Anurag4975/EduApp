'use client'

import { useState } from 'react'
import LessonViewer from './LessonViewer'
import AssignmentList from './AssignmentList'
import QuizList from './QuizList'

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

interface CoursePageTabsProps {
  courseId: string
  modules: Module[]
  completedLessonIds: string[]
  assignments: any[]
  scaleLabel: string
  quizzes: any[]
  assignmentCount: number
  quizCount: number
  studentEmail: string
  studentName: string
}

export default function CoursePageTabs({
  courseId,
  modules,
  completedLessonIds,
  assignments,
  scaleLabel,
  quizzes,
  assignmentCount,
  quizCount,
  studentEmail,
  studentName,
}: CoursePageTabsProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'assignments' | 'quizzes'>('content')

  const tabs = [
    { key: 'content', label: `Content (${modules.length})` },
    { key: 'assignments', label: `Assignments (${assignmentCount})` },
    { key: 'quizzes', label: `Quizzes (${quizCount})` },
  ] as const

  return (
    <div>
      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid #f3f4f6',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab.key ? '#6366f1' : '#6b7280',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        modules.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No content has been added yet.</p>
          </div>
        ) : (
          <LessonViewer
            modules={modules}
            courseId={courseId}
            completedLessonIds={completedLessonIds}
            studentEmail={studentEmail}
            studentName={studentName}
          />
        )
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        assignments.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No assignments yet.</p>
          </div>
        ) : (
          <AssignmentList
            courseId={courseId}
            assignments={assignments}
            scaleLabel={scaleLabel}
          />
        )
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        quizzes.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No quizzes yet.</p>
          </div>
        ) : (
          <QuizList courseId={courseId} quizzes={quizzes} />
        )
      )}
    </div>
  )
}
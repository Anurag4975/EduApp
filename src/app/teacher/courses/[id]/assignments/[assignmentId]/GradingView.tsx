'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { gradeSubmission, markOfflineComplete } from './actions'

interface Submission {
  id: string
  student_id: string
  file_url: string | null
  grade_value: number | null
  feedback: string | null
  status: string
  is_completed: boolean | null
  users: { full_name: string; email: string }
}

interface Student {
  studentId: string
  fullName: string
  email: string
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  submission_type: 'online' | 'offline'
  grading_type: 'graded' | 'completion_only'
  category: string
  max_marks: number | null
}

export default function GradingView({
  courseId,
  assignment,
  submissions,
  enrolledStudents,
  tenantId,
  scaleMax,
  scaleLabel,
}: {
  courseId: string
  assignment: Assignment
  submissions: Submission[]
  enrolledStudents: Student[]
  tenantId: string
  scaleMax: number
  scaleLabel: string
}) {
  const router = useRouter()

  // Map studentId -> submission
  const submissionMap: Record<string, Submission> = {}
  submissions.forEach((s) => { submissionMap[s.student_id] = s })

  const [grades, setGrades] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    submissions.forEach((s) => {
      if (s.grade_value !== null) init[s.student_id] = String(s.grade_value)
    })
    return init
  })

  const [feedbacks, setFeedbacks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    submissions.forEach((s) => {
      if (s.feedback) init[s.student_id] = s.feedback
    })
    return init
  })

  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  async function handleGrade(studentId: string) {
    const submission = submissionMap[studentId]
    if (!submission) return

    setSaving((p) => ({ ...p, [studentId]: true }))
    await gradeSubmission(
      submission.id,
      Number(grades[studentId] ?? 0),
      feedbacks[studentId] ?? ''
    )
    setSaving((p) => ({ ...p, [studentId]: false }))
    setSaved((p) => ({ ...p, [studentId]: true }))
    setTimeout(() => setSaved((p) => ({ ...p, [studentId]: false })), 2000)
    router.refresh()
  }

  async function handleMarkComplete(studentId: string, isCompleted: boolean) {
    setSaving((p) => ({ ...p, [studentId]: true }))
    await markOfflineComplete({
      tenantId,
      assignmentId: assignment.id,
      studentId,
      isCompleted,
    })
    setSaving((p) => ({ ...p, [studentId]: false }))
    router.refresh()
  }

  const submittedCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length
  const gradedCount = submissions.filter((s) => s.status === 'graded').length

  return (
    <div style={{ maxWidth: '800px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push(`/teacher/courses/${courseId}`)}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '12px' }}
        >
          ← Back to course
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          {assignment.title}
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          {assignment.description}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
          {[
            assignment.submission_type === 'online' ? '📤 Online' : '✋ Offline',
            assignment.grading_type === 'graded' ? `📊 Graded (${scaleLabel})` : '✓ Completion only',
            assignment.category === 'formative' ? '📝 Formative' : '🎯 Summative',
            `Due: ${new Date(assignment.due_date).toLocaleDateString()}`,
          ].map((tag) => (
            <span key={tag} style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', borderRadius: '20px', color: '#374151' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Enrolled', value: enrolledStudents.length, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Submitted', value: submittedCount, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Graded', value: gradedCount, color: '#16a34a', bg: '#dcfce7' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: s.color, display: 'block' }}>{s.value}</span>
            <span style={{ fontSize: '13px', color: s.color, fontWeight: '500' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Student List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {enrolledStudents.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No students enrolled yet.</p>
          </div>
        ) : (
          enrolledStudents.map((student) => {
            const submission = submissionMap[student.studentId]
            const isGraded = submission?.status === 'graded'

            return (
              <div
                key={student.studentId}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '14px',
                  border: `1px solid ${isGraded ? '#bbf7d0' : '#f3f4f6'}`,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Student info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>{student.fullName}</p>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{student.email}</p>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: isGraded ? '#dcfce7' : submission ? '#fffbeb' : '#f3f4f6',
                    color: isGraded ? '#16a34a' : submission ? '#f59e0b' : '#9ca3af',
                  }}>
                    {isGraded ? '✓ Graded' : submission ? 'Submitted' : 'Not submitted'}
                  </span>
                </div>

                {/* Online submission file link */}
                {assignment.submission_type === 'online' && submission?.file_url && (
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', color: '#6366f1', fontWeight: '500', textDecoration: 'none' }}
                  >
                    📎 View submitted file →
                  </a>
                )}

                {/* No submission yet */}
                {!submission && assignment.submission_type === 'online' && (
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No file submitted yet.</p>
                )}

                {/* Graded type — grade + feedback inputs */}
                {assignment.grading_type === 'graded' && submission && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        min={0}
                        max={scaleMax}
                        placeholder={`Grade / ${scaleMax}`}
                        value={grades[student.studentId] ?? ''}
                        onChange={(e) => setGrades((p) => ({ ...p, [student.studentId]: e.target.value }))}
                        style={{
                          width: '100px',
                          padding: '8px 10px',
                          fontSize: '14px',
                          border: '1.5px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          backgroundColor: '#fff',
                          color: '#111827',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>/ {scaleMax} ({scaleLabel})</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Feedback (optional)"
                      value={feedbacks[student.studentId] ?? ''}
                      onChange={(e) => setFeedbacks((p) => ({ ...p, [student.studentId]: e.target.value }))}
                      style={{
                        padding: '8px 10px',
                        fontSize: '14px',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '8px',
                        outline: 'none',
                        backgroundColor: '#fff',
                        color: '#111827',
                      }}
                    />
                    <button
                      onClick={() => handleGrade(student.studentId)}
                      disabled={saving[student.studentId]}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '8px 16px',
                        backgroundColor: saved[student.studentId] ? '#16a34a' : '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      {saved[student.studentId] ? '✓ Saved' : saving[student.studentId] ? 'Saving...' : 'Save Grade'}
                    </button>
                  </div>
                )}

                {/* Completion only — mark complete/incomplete toggle */}
                {assignment.grading_type === 'completion_only' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['completed', 'not completed'] as const).map((status) => {
                      const isCompleted = status === 'completed'
                      const isActive = submission?.is_completed === isCompleted
                      return (
                        <button
                          key={status}
                          onClick={() => handleMarkComplete(student.studentId, isCompleted)}
                          disabled={saving[student.studentId]}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '8px',
                            border: '1.5px solid',
                            borderColor: isActive ? (isCompleted ? '#16a34a' : '#dc2626') : '#e5e7eb',
                            backgroundColor: isActive ? (isCompleted ? '#dcfce7' : '#fee2e2') : '#fff',
                            color: isActive ? (isCompleted ? '#16a34a' : '#dc2626') : '#6b7280',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                          }}
                        >
                          {isCompleted ? '✓ Completed' : '✗ Not completed'}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
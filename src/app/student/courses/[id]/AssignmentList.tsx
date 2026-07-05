'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitAssignment } from './assignment-actions'
import FileUploader from '@/components/upload/FileUploader'

interface Submission {
  id: string
  file_url: string | null
  grade_value: number | null
  is_completed: boolean | null
  status: string
  feedback: string | null
  submitted_at: string | null
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  submission_type: string
  grading_type: string
  category: string
  max_marks: number | null
  submission: Submission | null
}

export default function AssignmentList({
  courseId,
  assignments,
  scaleLabel,
}: {
  courseId: string
  assignments: Assignment[]
  scaleLabel: string
}) {
  const router = useRouter()
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  async function handleUploadComplete(assignmentId: string, key: string) {
    await submitAssignment(assignmentId, courseId, `/api/files/${key}`)
    setUploadingId(null)
    router.refresh()
  }

  if (assignments.length === 0) return null

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

  return (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Assignments</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {assignments.map((a) => {
          const overdue = isOverdue(a.due_date) && !a.submission
          const isGraded = a.submission?.status === 'graded'

          return (
            <div
              key={a.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #f3f4f6',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{a.title}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>{a.description}</p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: overdue ? '#fee2e2' : '#f3f4f6',
                    color: overdue ? '#dc2626' : '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Due {new Date(a.due_date).toLocaleDateString()}
                </span>
              </div>

              {/* Offline assignment */}
              {a.submission_type === 'offline' && (
                <div>
                  {a.submission?.is_completed ? (
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a' }}>✓ Marked as completed</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Awaiting completion by teacher</span>
                  )}
                </div>
              )}

              {/* Online assignment */}
              {a.submission_type === 'online' && (
                <div>
                  {a.submission?.file_url ? (
                    <a
                      href={a.submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}
                    >
                      📄 View your submission →
                    </a>
                  ) : uploadingId === a.id ? (
                    <FileUploader
                      folder="assignments"
                      accept=".pdf,.doc,.docx,image/*"
                      onUploadComplete={(key) => handleUploadComplete(a.id, key)}
                    />
                  ) : (
                    <button
                      onClick={() => setUploadingId(a.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Upload Submission
                    </button>
                  )}
                </div>
              )}

              {/* Grade / Feedback */}
              {isGraded && a.grading_type === 'graded' && a.submission?.grade_value != null && (
                <div style={{ padding: '10px 14px', backgroundColor: '#eef2ff', borderRadius: '10px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#6366f1', margin: 0 }}>
                    Grade: {a.submission.grade_value} / {a.max_marks} ({scaleLabel})
                  </p>
                  {a.submission.feedback && (
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                      "{a.submission.feedback}"
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
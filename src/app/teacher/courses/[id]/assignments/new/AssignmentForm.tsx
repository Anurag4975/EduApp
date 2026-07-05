'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAssignment } from '../actions'
import Card from '@/components/ui/Card'
import FormField from '@/components/ui/FormField'

export default function AssignmentForm({
  courseId,
  scaleMax,
  scaleLabel,
}: {
  courseId: string
  scaleMax: number
  scaleLabel: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submissionType, setSubmissionType] = useState<'online' | 'offline'>('online')
  const [gradingType, setGradingType] = useState<'graded' | 'completion_only'>('graded')
  const [category, setCategory] = useState<'formative' | 'summative'>('formative')
  const [maxMarks, setMaxMarks] = useState(String(scaleMax))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await createAssignment({
      courseId,
      title,
      description,
      dueDate,
      submissionType,
      gradingType,
      category,
      maxMarks: gradingType === 'graded' ? Number(maxMarks) : undefined,
    })

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    router.push(`/teacher/courses/${courseId}`)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '12px' }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Create Assignment</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Title" placeholder="e.g. Chapter 3 Homework" value={title} onChange={setTitle} required />
          <FormField
            label="Description"
            as="textarea"
            placeholder="Instructions for students"
            value={description}
            onChange={setDescription}
            required
          />
          <FormField
            label="Due date"
            type="datetime-local"
            value={dueDate}
            onChange={setDueDate}
            required
          />
        </Card>

        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Submission type
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(['online', 'offline'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSubmissionType(type)}
                  style={{
                    flex: '1 1 140px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: submissionType === type ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                    backgroundColor: submissionType === type ? '#eef2ff' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    {type === 'online' ? '📤 Online' : '✋ Offline'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    {type === 'online' ? 'Students upload a file' : 'Mark complete manually'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Grading type
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(['graded', 'completion_only'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGradingType(type)}
                  style={{
                    flex: '1 1 140px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: gradingType === type ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                    backgroundColor: gradingType === type ? '#eef2ff' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    {type === 'graded' ? '📊 Graded' : '✓ Completion only'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    {type === 'graded' ? `Scored using ${scaleLabel}` : 'Just marked done/not done'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {gradingType === 'graded' && (
            <FormField
              label={`Max marks (${scaleLabel})`}
              type="number"
              value={maxMarks}
              onChange={setMaxMarks}
              required
            />
          )}

          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Category
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(['formative', 'summative'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCategory(type)}
                  style={{
                    flex: '1 1 140px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: category === type ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                    backgroundColor: category === type ? '#eef2ff' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    {type === 'formative' ? '📝 Formative' : '🎯 Summative'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    {type === 'formative' ? 'Practice / ongoing' : 'Final / evaluative'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {error && (
          <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ padding: '11px 20px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '11px 24px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  )
}
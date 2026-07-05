'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'

const categoryColors: Record<string, { bg: string; color: string }> = {
  formative: { bg: '#fffbeb', color: '#f59e0b' },
  summative: { bg: '#eef2ff', color: '#6366f1' },
}

export default function GradesTabs({
  grades,
  quizResults,
  scaleLabel,
  scaleMax,
}: {
  grades: any[]
  quizResults: any[]
  scaleLabel: string
  scaleMax: number
}) {
  const [activeTab, setActiveTab] = useState<'assignments' | 'quizzes'>('assignments')

  // Sort assignments by due date descending
  const sortedGrades = [...grades].sort((a, b) =>
    new Date(b.assignments?.due_date).getTime() - new Date(a.assignments?.due_date).getTime()
  )

  // Sort quizzes by completed date descending
  const sortedQuizzes = [...quizResults].sort((a, b) =>
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )

  return (
    <div>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f3f4f6', marginBottom: '20px' }}>
        {([
          { key: 'assignments', label: `Assignments (${grades.length})` },
          { key: 'quizzes', label: `Quizzes (${quizResults.length})` },
        ] as const).map((tab) => (
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

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedGrades.length === 0 ? (
            <Card style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No assignments yet.</p>
            </Card>
          ) : (
            sortedGrades.map((g: any) => {
              const assignment = g.assignments
              const isGraded = assignment?.grading_type === 'graded'
              const hasGrade = g.grade_value != null
              const isCompleted = g.is_completed
              const percentage = hasGrade && assignment?.max_marks
                ? Math.round((g.grade_value / assignment.max_marks) * 100)
                : null
              const gradeColor = percentage != null
                ? percentage >= 80 ? '#16a34a' : percentage >= 50 ? '#f59e0b' : '#dc2626'
                : '#9ca3af'

              return (
                <Card key={g.id} style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                          {assignment?.title}
                        </p>
                        <span style={{
                          fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                          textTransform: 'capitalize',
                          backgroundColor: categoryColors[assignment?.category]?.bg ?? '#f3f4f6',
                          color: categoryColors[assignment?.category]?.color ?? '#6b7280',
                        }}>
                          {assignment?.category}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                        📚 {assignment?.courses?.title} · Due {new Date(assignment?.due_date).toLocaleDateString()}
                      </p>
                      {g.feedback && (
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                          "{g.feedback}"
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {isGraded ? (
                        hasGrade ? (
                          <div>
                            <p style={{ fontSize: '22px', fontWeight: '700', color: gradeColor, margin: 0 }}>
                              {g.grade_value}/{assignment?.max_marks}
                            </p>
                            <p style={{ fontSize: '11px', color: gradeColor, margin: '2px 0 0 0' }}>
                              {percentage}% · {scaleLabel}
                            </p>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
                            Awaiting grade
                          </span>
                        )
                      ) : (
                        isCompleted
                          ? <span style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a' }}>✓ Completed</span>
                          : <span style={{ fontSize: '12px', color: '#9ca3af' }}>Pending</span>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedQuizzes.length === 0 ? (
            <Card style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No quizzes completed yet.</p>
            </Card>
          ) : (
            sortedQuizzes.map((r: any) => {
              const quiz = r.quizzes
              const score = r.score ?? 0
              const total = quiz?.total_marks ?? 100
              const pct = Math.round((score / total) * 100)
              const gradeColor = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#dc2626'

              return (
                <Card key={r.id} style={{ padding: '16px 20px', borderLeft: '3px solid #6366f1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {quiz?.title}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                        📚 {quiz?.courses?.title} · Completed {new Date(r.completed_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '22px', fontWeight: '700', color: gradeColor, margin: 0 }}>
                        {score}/{total}
                      </p>
                      <p style={{ fontSize: '11px', color: gradeColor, margin: '2px 0 0 0' }}>
                        {pct}%
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
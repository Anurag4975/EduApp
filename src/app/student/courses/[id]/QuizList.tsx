'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startQuiz } from './quiz/actions'
import QuizCard from '@/components/ui/QuizCard'

interface Quiz {
  id: string
  title: string
  description: string | null
  duration_mins: number | null
  total_marks: number
  quiz_questions: { id: string }[]
  attempt: {
    id: string
    score: number | null
    completed_at: string | null
  } | null
}

export default function QuizList({
  courseId,
  quizzes,
}: {
  courseId: string
  quizzes: Quiz[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  if (quizzes.length === 0) return null

  async function handleStart(quizId: string) {
    setLoading(quizId)
    const result = await startQuiz(quizId)
    setLoading(null)

    if (result.success && result.attemptId) {
      router.push(`/student/courses/${courseId}/quiz/${quizId}?attempt=${result.attemptId}`)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
        Quizzes
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {quizzes.map((quiz) => {
          const completed = !!quiz.attempt?.completed_at
          const percentage = completed && quiz.attempt?.score != null
            ? Math.round((quiz.attempt.score / quiz.total_marks) * 100)
            : null

          return (
            <QuizCard
              key={quiz.id}
              title={quiz.title}
              description={quiz.description}
              totalMarks={quiz.total_marks}
              durationMins={quiz.duration_mins}
              questionCount={quiz.quiz_questions?.length ?? 0}
              action={
                completed ? (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: (percentage ?? 0) >= 50 ? '#16a34a' : '#dc2626',
                      margin: 0,
                    }}>
                      {quiz.attempt?.score}/{quiz.total_marks}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
                      {percentage}% · Completed
                    </p>
                    <button
                      onClick={() => router.push(`/student/courses/${courseId}/quiz/${quiz.id}?attempt=${quiz.attempt?.id}&review=true`)}
                      style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '4px' }}
                    >
                      Review answers →
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStart(quiz.id)}
                    disabled={loading === quiz.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      opacity: loading === quiz.id ? 0.7 : 1,
                    }}
                  >
                    {loading === quiz.id ? 'Starting...' : 'Start Quiz'}
                  </button>
                )
              }
            />
          )
        })}
      </div>
    </div>
  )
}
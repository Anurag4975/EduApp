'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitQuiz } from './actions'
import QuizResult from '@/components/ui/QuizResult'

export default function QuizAttempt({
  courseId,
  quiz,
  attempt,
  isReview,
}: {
  courseId: string
  quiz: any
  attempt: any
  isReview: boolean
}) {
  const router = useRouter()
  const questions = quiz.quiz_questions ?? []

  // answers: questionId -> array of selected options
  const [answers, setAnswers] = useState<Record<string, string[]>>(() => {
  if (attempt.quiz_answers && attempt.quiz_answers.length > 0) {
    const initial: Record<string, string[]> = {}
    attempt.quiz_answers.forEach((a: any) => {
      // Use selected_options array if available, fall back to single selected_option
      initial[a.question_id] = a.selected_options?.length > 0
        ? a.selected_options
        : a.selected_option ? [a.selected_option] : []
    })
    return initial
  }
  return {}
})

  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitted, setSubmitted] = useState(!!attempt.completed_at)
  const [score, setScore] = useState<number | null>(attempt.score)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.duration_mins && !attempt.completed_at ? quiz.duration_mins * 60 : null
  )

  // Anti-cheat state
  const [warning, setWarning] = useState<string | null>(null)
  const [warningCount, setWarningCount] = useState(0)
  const warningCountRef = useRef(0)
  const submittedRef = useRef(!!attempt.completed_at)

  // Ref for answers to avoid stale closures in timer auto-submit
  const answersRef = useRef(answers)
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  async function doSubmit() {
  if (submittedRef.current) return
  submittedRef.current = true
  setLoading(true)

  const answerArray = questions.map((q: any) => ({
    questionId: q.id,
    selectedOption: (answersRef.current[q.id] ?? [])[0] ?? '',
    selectedOptions: answersRef.current[q.id] ?? [],
  }))

  const result = await submitQuiz(attempt.id, quiz.id, courseId, answerArray)
  if (result.success) {
    setScore(result.score ?? null)
    setSubmitted(true)
  }
  setLoading(false)
}

  // Auto submit function (ref-safe)
  const autoSubmit = useCallback(async (reason: string) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setWarning(`⚠️ Auto-submitted: ${reason}`)
    await doSubmit()
  }, []) // doSubmit only uses refs, no stale closure issues

  // Anti-cheat: tab visibility
  useEffect(() => {
    if (submitted || isReview) return

    function handleVisibilityChange() {
      if (document.hidden) {
        warningCountRef.current += 1
        setWarningCount(warningCountRef.current)

        if (warningCountRef.current >= 3) {
          autoSubmit('You switched tabs 3 times.')
        } else {
          setWarning(`⚠️ Warning ${warningCountRef.current}/2: Do not switch tabs during the quiz!`)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [submitted, isReview, autoSubmit])

  // Anti-cheat: keyboard shortcuts
  useEffect(() => {
    if (submitted || isReview) return

    function handleKeyDown(e: KeyboardEvent) {
      const blocked = [
        e.ctrlKey && e.key === 'c',
        e.ctrlKey && e.key === 'a',
        e.ctrlKey && e.key === 'p',
        e.ctrlKey && e.key === 's',
        e.key === 'PrintScreen',
        e.metaKey && e.key === 'c',
        e.metaKey && e.key === 'a',
      ]

      if (blocked.some(Boolean)) {
        e.preventDefault()
        warningCountRef.current += 1
        setWarningCount(warningCountRef.current)

        if (warningCountRef.current >= 3) {
          autoSubmit('Repeated keyboard shortcut violations.')
        } else {
          setWarning(`⚠️ Warning ${warningCountRef.current}/2: Keyboard shortcuts are not allowed!`)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitted, isReview, autoSubmit])

  // Anti-cheat: text selection / copy
  useEffect(() => {
    if (submitted || isReview) return

    function handleCopy(e: ClipboardEvent) {
      e.preventDefault()
      warningCountRef.current += 1
      setWarningCount(warningCountRef.current)

      if (warningCountRef.current >= 3) {
        autoSubmit('Repeated copy attempts.')
      } else {
        setWarning(`⚠️ Warning ${warningCountRef.current}/2: Copying is not allowed during the quiz!`)
      }
    }

    document.addEventListener('copy', handleCopy)
    return () => document.removeEventListener('copy', handleCopy)
  }, [submitted, isReview, autoSubmit])

  // Timer
  useEffect(() => {
    if (!timeLeft || submitted || isReview) return
    if (timeLeft <= 0) {
      autoSubmit('Time ran out.')
      return
    }
    const timer = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, submitted, isReview, autoSubmit])

  function toggleAnswer(questionId: string, option: string, allowMultiple: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? []
      if (!allowMultiple) return { ...prev, [questionId]: [option] }
      const exists = current.includes(option)
      return {
        ...prev,
        [questionId]: exists
          ? current.filter((o) => o !== option)
          : [...current, option],
      }
    })
  }

  // Calculate results after submission
  const correctCount = submitted
  ? questions.filter((q: any) => {
      const userAnswers = answersRef.current[q.id] ?? []
      if (q.allow_multiple) {
        const correctOpts: string[] = q.correct_options ?? [q.correct_option]
        return (
          correctOpts.length === userAnswers.length &&
          correctOpts.every((o: string) => userAnswers.includes(o))
        )
      }
      return userAnswers[0] === q.correct_option
    }).length
  : 0

  const timeTaken =
    attempt.started_at && attempt.completed_at
      ? (() => {
          const diff = Math.round(
            (new Date(attempt.completed_at).getTime() -
              new Date(attempt.started_at).getTime()) /
              1000
          )
          return formatTime(diff)
        })()
      : undefined

  const currentQ = questions[currentIndex]

  return (
    <div
      style={{
        maxWidth: '1100px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        userSelect: submitted || isReview ? 'auto' : 'none',
      }}
    >
      {/* Warning Banner */}
      {warning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#dc2626',
            color: '#fff',
            padding: '14px 20px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{warning}</span>
          <button
            onClick={() => setWarning(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
          marginTop: warning ? '48px' : '0',
        }}
      >
        <div>
          {(submitted || isReview) && (
            <button
              onClick={() => router.push(`/student/courses/${courseId}`)}
              style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '8px' }}
            >
              ← Back to course
            </button>
          )}
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>{quiz.title}</h1>
          {quiz.description && (
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{quiz.description}</p>
          )}
        </div>

        {timeLeft !== null && !submitted && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: timeLeft < 60 ? '#fee2e2' : '#eef2ff',
              borderRadius: '10px',
              textAlign: 'center',
              minWidth: '80px',
            }}
          >
            <p style={{ fontSize: '20px', fontWeight: '700', color: timeLeft < 60 ? '#dc2626' : '#6366f1', margin: 0 }}>
              {formatTime(timeLeft)}
            </p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>remaining</p>
          </div>
        )}
      </div>

      {/* Result */}
      {(submitted || isReview) && score !== null && (
        <div style={{ marginBottom: '24px' }}>
          <QuizResult
            score={score}
            totalMarks={quiz.total_marks}
            correctCount={correctCount}
            totalQuestions={questions.length}
            timeTaken={timeTaken}
          />
        </div>
      )}

      {/* Main Layout: Question + Navigator */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Question Area */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {currentQ && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1' }}>
                  Q{currentIndex + 1} of {questions.length}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentQ.marks} mark{currentQ.marks > 1 ? 's' : ''}</span>
                  {currentQ.allow_multiple && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#fffbeb', color: '#f59e0b', fontWeight: '600' }}>
                      Select all correct
                    </span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '15px', color: '#111827', margin: 0, lineHeight: '1.6' }}>
                {currentQ.question_text}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                  const text = currentQ[`option_${opt}`]
                  if (!text) return null

                  const userAnswers = answers[currentQ.id] ?? []
                  const isSelected = userAnswers.includes(opt)
                  const isCorrect = currentQ.allow_multiple
                    ? (currentQ.correct_options ?? [currentQ.correct_option]).includes(opt)
                    : currentQ.correct_option === opt
                  const isWrong = (submitted || isReview) && isSelected && !isCorrect

                  let bg = '#ffffff'
                  let borderColor = '#e5e7eb'
                  let color = '#374151'

                  if (!submitted && !isReview && isSelected) {
                    bg = '#eef2ff'; borderColor = '#6366f1'; color = '#6366f1'
                  }
                  if ((submitted || isReview) && isCorrect) {
                    bg = '#dcfce7'; borderColor = '#16a34a'; color = '#16a34a'
                  }
                  if (isWrong) {
                    bg = '#fee2e2'; borderColor = '#dc2626'; color = '#dc2626'
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => !submitted && !isReview && toggleAnswer(currentQ.id, opt, currentQ.allow_multiple)}
                      disabled={submitted || isReview}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${borderColor}`,
                        backgroundColor: bg,
                        color,
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: submitted || isReview ? 'default' : 'pointer',
                        width: '100%',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontWeight: '700', flexShrink: 0 }}>{opt.toUpperCase()}.</span>
                      <span style={{ flex: 1 }}>{text}</span>
                      {(submitted || isReview) && isCorrect && <span>✓</span>}
                      {isWrong && <span>✗</span>}
                    </button>
                  )
                })}
              </div>

              {/* Prev / Next */}
              {!submitted && !isReview && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <button
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    style={{ padding: '9px 18px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', opacity: currentIndex === 0 ? 0.5 : 1 }}
                  >
                    ← Previous
                  </button>
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((i) => i + 1)}
                      style={{ padding: '9px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={doSubmit}
                      disabled={loading}
                      style={{ padding: '9px 18px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                  )}
                </div>
              )}

              {/* Review navigation */}
              {(submitted || isReview) && questions.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <button
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    style={{ padding: '9px 18px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: currentIndex === 0 ? 0.5 : 1 }}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                    disabled={currentIndex === questions.length - 1}
                    style={{ padding: '9px 18px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: currentIndex === questions.length - 1 ? 0.5 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Navigator */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '16px', position: 'sticky', top: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
              Questions
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
              {questions.map((q: any, i: number) => {
                const attempted = (answers[q.id] ?? []).length > 0
                const isCurrent = i === currentIndex

                let bg = '#f3f4f6'
                let color = '#6b7280'
                let border = '1.5px solid transparent'

                if (isCurrent) { border = '1.5px solid #6366f1' }
                if (attempted && !submitted) { bg = '#eef2ff'; color = '#6366f1' }
                if (submitted || isReview) {
                  const userAnswers = answers[q.id] ?? []
                  const isCorrect = q.allow_multiple
                    ? (q.correct_options ?? [q.correct_option]).every((o: string) => userAnswers.includes(o)) && userAnswers.length === (q.correct_options ?? [q.correct_option]).length
                    : userAnswers[0] === q.correct_option
                  bg = isCorrect ? '#dcfce7' : attempted ? '#fee2e2' : '#f3f4f6'
                  color = isCorrect ? '#16a34a' : attempted ? '#dc2626' : '#9ca3af'
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border,
                      backgroundColor: bg,
                      color,
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {!submitted && !isReview && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#eef2ff' }} />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Answered</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f3f4f6' }} />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Not answered</span>
                  </div>
                </>
              )}
              {(submitted || isReview) && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#dcfce7' }} />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Correct</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#fee2e2' }} />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Wrong</span>
                  </div>
                </>
              )}
              {!submitted && !isReview && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                    {Object.keys(answers).length}/{questions.length} answered
                  </p>
                  {warningCount > 0 && (
                    <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0 0', fontWeight: '600' }}>
                      ⚠️ {warningCount}/2 warnings
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveQuiz, updateQuizQuestions, deleteQuiz } from './actions'
import QuizCard from '@/components/ui/QuizCard'
import QuizQuestion from '@/components/ui/QuizQuestion'

interface LocalQuestion {
  id: string // temp local id
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  correct_options: string[]
  allow_multiple: boolean
  marks: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  duration_mins: number | null
  total_marks: number
  quiz_questions: any[]
}
interface Quiz {
  id: string
  title: string
  description: string | null
  duration_mins: number | null
  total_marks: number
  quiz_questions: any[]
  attempts: {
    id: string
    score: number | null
    started_at: string
    completed_at: string | null
    users: { full_name: string; email: string }
  }[]
}

const emptyQuestion = (): LocalQuestion => ({
  id: Math.random().toString(36).slice(2),
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  correct_options: ['a'],
  allow_multiple: false,
  marks: 1,
})

export default function QuizBuilder({
  courseId,
  quizzes,
}: {
  courseId: string
  quizzes: Quiz[]
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(false)

  // Quiz meta fields
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [duration, setDuration] = useState('30')
  const [totalMarks, setTotalMarks] = useState('100')

  // Questions (local state)
  const [questions, setQuestions] = useState<LocalQuestion[]>([emptyQuestion()])
  const [showResultsId, setShowResultsId] = useState<string | null>(null)

  function startCreate() {
    setTitle('')
    setDesc('')
    setDuration('30')
    setTotalMarks('100')
    setQuestions([emptyQuestion()])
    setEditingQuiz(null)
    setMode('create')
  }

  function startEdit(quiz: Quiz) {
    setTitle(quiz.title)
    setDesc(quiz.description ?? '')
    setDuration(String(quiz.duration_mins ?? 30))
    setTotalMarks(String(quiz.total_marks))
    setQuestions(
      quiz.quiz_questions.length > 0
        ? quiz.quiz_questions.map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c ?? '',
            option_d: q.option_d ?? '',
            correct_option: q.correct_option,
            correct_options: q.correct_options ?? [q.correct_option],
            allow_multiple: q.allow_multiple ?? false,
            marks: q.marks,
          }))
        : [emptyQuestion()]
    )
    setEditingQuiz(quiz)
    setMode('edit')
  }

  function updateQuestion(id: string, field: keyof LocalQuestion, value: any) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        if (field === 'correct_options') {
          return { ...q, correct_options: value, correct_option: value[0] ?? 'a' }
        }
        return { ...q, [field]: value }
      })
    )
  }

  function toggleCorrectOption(qId: string, opt: string, allowMultiple: boolean) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q
        if (!allowMultiple) {
          return { ...q, correct_option: opt, correct_options: [opt] }
        }
        const existing = q.correct_options.includes(opt)
        const updated = existing
          ? q.correct_options.filter((o) => o !== opt)
          : [...q.correct_options, opt]
        return {
          ...q,
          correct_options: updated,
          correct_option: updated[0] ?? opt,
        }
      })
    )
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()])
  }

  function removeQuestion(id: string) {
    if (questions.length === 1) return
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  async function handleSave() {
    if (!title.trim()) return
    const validQuestions = questions.filter((q) => q.question_text.trim() && q.option_a.trim() && q.option_b.trim())
    if (validQuestions.length === 0) return

    setLoading(true)

    if (mode === 'create') {
      await saveQuiz({
        courseId,
        title,
        description: desc,
        durationMins: Number(duration),
        totalMarks: Number(totalMarks),
        questions: validQuestions,
      })
    } else if (mode === 'edit' && editingQuiz) {
      await updateQuizQuestions(editingQuiz.id, courseId, validQuestions)
    }

    setLoading(false)
    setMode('list')
    router.refresh()
  }

  async function handleDelete(quizId: string) {
    if (!confirm('Delete this quiz and all its questions?')) return
    await deleteQuiz(quizId, courseId)
    router.refresh()
  }

  // LIST MODE
  if (mode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
       {quizzes.map((quiz) => (
  <div key={quiz.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px' }}>
      <QuizCard
        title={quiz.title}
        description={quiz.description}
        totalMarks={quiz.total_marks}
        durationMins={quiz.duration_mins}
        questionCount={quiz.quiz_questions?.length ?? 0}
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => startEdit(quiz)}
              style={{ padding: '7px 14px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(quiz.id)}
              style={{ padding: '7px 14px', backgroundColor: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              Delete
            </button>
          </div>
        }
      />
    </div>

    {/* Results toggle */}
    <button
      onClick={() => setShowResultsId(showResultsId === quiz.id ? null : quiz.id)}
      style={{ background: 'none', border: 'none', borderTop: '1px solid #f3f4f6', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: '10px 20px', textAlign: 'left', width: '100%' }}
    >
      {showResultsId === quiz.id ? '▲ Hide' : '▼ View'} Results ({quiz.attempts?.filter(a => a.completed_at).length ?? 0} attempted)
    </button>

    {showResultsId === quiz.id && (
      <div style={{ padding: '0 16px 16px' }}>
        {(quiz.attempts?.filter(a => a.completed_at).length ?? 0) === 0 ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', padding: '12px 0' }}>No students have attempted this quiz yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '400px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['Student', 'Score', '%', 'Time', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quiz.attempts
                  .filter((a) => a.completed_at)
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .map((attempt, i) => {
                    const pct = quiz.total_marks > 0
                      ? Math.round(((attempt.score ?? 0) / quiz.total_marks) * 100)
                      : 0
                    const diff = attempt.started_at && attempt.completed_at
                      ? Math.round((new Date(attempt.completed_at).getTime() - new Date(attempt.started_at).getTime()) / 1000)
                      : null
                    const timeTaken = diff != null ? `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')}` : '—'

                    return (
                      <tr key={attempt.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111827' }}>
                          {attempt.users?.full_name ?? '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>
                          {attempt.score ?? 0}/{quiz.total_marks}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                            backgroundColor: pct >= 80 ? '#dcfce7' : pct >= 50 ? '#fffbeb' : '#fee2e2',
                            color: pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#dc2626',
                          }}>
                            {pct}%
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{timeTaken}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                          {new Date(attempt.completed_at!).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
  </div>
))}

        <button
          onClick={startCreate}
          style={{ padding: '16px', backgroundColor: '#ffffff', border: '1.5px dashed #d1d5db', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#6366f1' }}
        >
          + Create Quiz
        </button>
      </div>
    )
  }

  // CREATE / EDIT MODE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Quiz Meta */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
          {mode === 'create' ? 'New Quiz' : `Editing: ${editingQuiz?.title}`}
        </h3>
        <input placeholder="Quiz title *" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        <input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Duration (mins)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Total marks</label>
            <input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Questions */}
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>Questions</h3>

      {questions.map((q, i) => (
        <div key={q.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#6366f1' }}>Q{i + 1}</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={q.allow_multiple}
                  onChange={(e) => updateQuestion(q.id, 'allow_multiple', e.target.checked)}
                />
                Multiple correct answers
              </label>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(q.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>
                  Remove
                </button>
              )}
            </div>
          </div>

          <textarea
            placeholder="Question text *"
            value={q.question_text}
            rows={2}
            onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
            style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(['a', 'b', 'c', 'd'] as const).map((opt, oi) => {
              const field = `option_${opt}` as keyof LocalQuestion
              const val = q[field] as string
              const isCorrect = q.allow_multiple
                ? q.correct_options.includes(opt)
                : q.correct_option === opt
              const isRequired = opt === 'a' || opt === 'b'

              return (
                <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type={q.allow_multiple ? 'checkbox' : 'radio'}
                    name={`correct-${q.id}`}
                    checked={isCorrect}
                    onChange={() => toggleCorrectOption(q.id, opt, q.allow_multiple)}
                    title="Mark as correct"
                    style={{ flexShrink: 0, cursor: 'pointer' }}
                  />
                  <input
                    placeholder={`Option ${opt.toUpperCase()}${isRequired ? ' *' : ' (optional)'}`}
                    value={val}
                    onChange={(e) => updateQuestion(q.id, field, e.target.value)}
                    style={{
                      ...inputStyle,
                      borderColor: isCorrect ? '#16a34a' : '#e5e7eb',
                      backgroundColor: isCorrect ? '#f0fdf4' : '#ffffff',
                    }}
                  />
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Marks:</label>
            <input
              type="number"
              min="1"
              value={q.marks}
              onChange={(e) => updateQuestion(q.id, 'marks', Number(e.target.value))}
              style={{ ...inputStyle, width: '70px' }}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addQuestion}
        style={{ padding: '12px', backgroundColor: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}
      >
        + Add Another Question
      </button>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={() => setMode('list')}
          style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ padding: '10px 24px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Save Quiz' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  fontSize: '14px',
  border: '1.5px solid #e5e7eb',
  borderRadius: '8px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { QuizService } from '@/services/quiz.service'
import QuizAttempt from './QuizAttempt'

export default async function QuizAttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; quizId: string }>
  searchParams: Promise<{ attempt?: string; review?: string }>
}) {
  const { id, quizId } = await params
  const { attempt: attemptId, review } = await searchParams

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!attemptId) redirect(`/student/courses/${id}`)

  const quiz = await QuizService.getById(quizId)
  if (!quiz) redirect(`/student/courses/${id}`)

  const attempt = await QuizService.getAttempt(quizId, user.id)
  if (!attempt) redirect(`/student/courses/${id}`)

  const isReview = review === 'true' && !!attempt.completed_at
console.log('ATTEMPT:', JSON.stringify(attempt))

  return (
    <QuizAttempt
      courseId={id}
      quiz={quiz}
      attempt={attempt}
      isReview={isReview}
    />
  )
}
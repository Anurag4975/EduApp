'use server'

import { QuizService } from '@/services/quiz.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startQuiz(quizId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { success: false, error: 'Institution not found.' }

  // Check if already attempted
  const existing = await QuizService.getAttempt(quizId, user.id)
  if (existing?.completed_at) {
    return { success: false, error: 'Already attempted.', attemptId: existing.id }
  }

  // Return existing incomplete attempt or start new one
  if (existing) return { success: true, attemptId: existing.id }

  const attempt = await QuizService.startAttempt({
    tenant_id: profile.tenant_id,
    quiz_id: quizId,
    student_id: user.id,
  })

  if (!attempt) return { success: false, error: 'Failed to start quiz.' }

  return { success: true, attemptId: attempt.id }
}

export async function submitQuiz(
  attemptId: string,
  quizId: string,
  courseId: string,
  answers: { questionId: string; selectedOption: string }[]
) {
  const result = await QuizService.submitAttempt(attemptId, quizId, answers)

  if (!result) return { success: false, error: 'Failed to submit quiz.' }

  revalidatePath(`/student/courses/${courseId}`)
  return { success: true, score: result.score }
}
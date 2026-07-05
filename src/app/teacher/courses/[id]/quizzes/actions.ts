'use server'

import { QuizService } from '@/services/quiz.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveQuiz(data: {
  courseId: string
  title: string
  description: string
  durationMins: number
  totalMarks: number
  questions: {
    question_text: string
    option_a: string
    option_b: string
    option_c?: string
    option_d?: string
    correct_option: string
    correct_options: string[]
    allow_multiple: boolean
    marks: number
  }[]
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { success: false, error: 'Institution not found.' }

  const quiz = await QuizService.createWithQuestions({
    tenant_id: profile.tenant_id,
    course_id: data.courseId,
    title: data.title,
    description: data.description,
    duration_mins: data.durationMins,
    total_marks: data.totalMarks,
    questions: data.questions,
  })

  if (!quiz) return { success: false, error: 'Failed to save quiz.' }

  revalidatePath(`/teacher/courses/${data.courseId}`)
  return { success: true }
}

export async function updateQuizQuestions(
  quizId: string,
  courseId: string,
  questions: {
    question_text: string
    option_a: string
    option_b: string
    option_c?: string
    option_d?: string
    correct_option: string
    correct_options: string[]
    allow_multiple: boolean
    marks: number
  }[]
) {
  const success = await QuizService.updateQuestions(quizId, questions)
  if (!success) return { success: false, error: 'Failed to update questions.' }
  revalidatePath(`/teacher/courses/${courseId}`)
  return { success: true }
}

export async function deleteQuiz(quizId: string, courseId: string) {
  await QuizService.delete(quizId)
  revalidatePath(`/teacher/courses/${courseId}`)
}
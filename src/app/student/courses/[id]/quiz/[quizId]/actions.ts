'use server'

import { QuizService } from '@/services/quiz.service'
import { revalidatePath } from 'next/cache'

export async function submitQuiz(
  attemptId: string,
  quizId: string,
  courseId: string,
  answers: { questionId: string; selectedOption: string; selectedOptions?: string[] }[]
) {
  const result = await QuizService.submitAttempt(attemptId, quizId, answers)
  if (!result) return { success: false, error: 'Failed to submit quiz.' }
  revalidatePath(`/student/courses/${courseId}`)
  return { success: true, score: result.score }
}
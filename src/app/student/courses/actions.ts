'use server'
import { CourseService } from '@/services/course.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function enrollInCourse(courseId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) {
    return { success: false, error: 'Institution not found.' }
  }
  const alreadyEnrolled = await CourseService.isEnrolled(user.id, courseId)
  if (alreadyEnrolled) {
    return { success: false, error: 'Already enrolled in this course.' }
  }
  const success = await CourseService.enroll({
    tenant_id: profile.tenant_id,
    student_id: user.id,
    course_id: courseId,
  })
  if (!success) {
    return { success: false, error: 'Failed to enroll.' }
  }
  revalidatePath('/student/courses')
  revalidatePath('/student/dashboard')
  return { success: true }
}

export async function toggleLessonComplete(lessonId: string, courseId: string, completed: boolean) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'not authenticated' }

  if (completed) {
    const result = await CourseService.unmarkLessonComplete(user.id, lessonId)
    console.log('UNMARK result:', result)
  } else {
    const result = await CourseService.markLessonComplete(user.id, lessonId, courseId)
    console.log('MARK result:', result)
  }

  revalidatePath(`/student/courses/${courseId}`)
  return { success: true }
}
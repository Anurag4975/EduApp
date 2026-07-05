'use server'
import { CourseService } from '@/services/course.service'
import { NotificationService } from '@/services/notification.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addModule(courseId: string, title: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { success: false, error: 'Institution not found.' }
  const existingModules = await CourseService.getModulesWithLessons(courseId)
  const module = await CourseService.createModule({
    tenant_id: profile.tenant_id,
    course_id: courseId,
    title,
    order_index: existingModules.length,
  })
  if (!module) return { success: false, error: 'Failed to create module.' }
  revalidatePath(`/teacher/courses/${courseId}`)
  return { success: true }
}

export async function addLesson(
  moduleId: string,
  courseId: string,
  data: { title: string; type: 'video' | 'document' | 'text'; content_url?: string }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { success: false, error: 'Institution not found.' }
  const modules = await CourseService.getModulesWithLessons(courseId)
  const currentModule = modules.find((m) => m.id === moduleId)
  const lesson = await CourseService.createLesson({
    tenant_id: profile.tenant_id,
    module_id: moduleId,
    title: data.title,
    type: data.type,
    content_url: data.content_url,
    order_index: currentModule?.lessons.length ?? 0,
  })
  if (!lesson) return { success: false, error: 'Failed to create lesson.' }

  // Notify all enrolled students
  const enrolledStudents = await CourseService.getEnrolledStudents(courseId)
  const course = await CourseService.getById(courseId)
  if (enrolledStudents.length > 0) {
    await NotificationService.createBulk({
      tenant_id: profile.tenant_id,
      user_ids: enrolledStudents.map((s) => s.studentId),
      title: 'New lesson added',
      message: `"${data.title}" has been added to ${course?.title ?? 'your course'}`,
      type: 'lesson_created',
      link: `/student/courses/${courseId}`,
      metadata: { courseId, lessonId: lesson.id },
    })
  }

  revalidatePath(`/teacher/courses/${courseId}`)
  return { success: true }
}

export async function deleteModule(moduleId: string, courseId: string) {
  await CourseService.deleteModule(moduleId)
  revalidatePath(`/teacher/courses/${courseId}`)
}

export async function deleteLesson(lessonId: string, courseId: string) {
  await CourseService.deleteLesson(lessonId)
  revalidatePath(`/teacher/courses/${courseId}`)
}

export async function publishCourse(courseId: string) {
  await CourseService.updateStatus(courseId, 'published')
  revalidatePath('/teacher/courses')
}

export async function archiveCourse(courseId: string) {
  await CourseService.updateStatus(courseId, 'archived')
  revalidatePath('/teacher/courses')
}
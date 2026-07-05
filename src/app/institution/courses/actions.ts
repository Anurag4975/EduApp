'use server'

import { CourseService } from '@/services/course.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCourse(formData: {
  title: string
  description: string
  teacherId: string
}) {
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

  const course = await CourseService.create({
    tenant_id: profile.tenant_id,
    teacher_id: formData.teacherId,
    title: formData.title,
    description: formData.description,
  })

  if (!course) {
    return { success: false, error: 'Failed to create course.' }
  }

  revalidatePath('/institution/courses')
  revalidatePath('/institution/dashboard')

  return { success: true, courseId: course.id }
}

export async function reassignTeacher(courseId: string, teacherId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('courses')
    .update({ teacher_id: teacherId })
    .eq('id', courseId)

  revalidatePath('/institution/courses')
  return { success: !error }
}
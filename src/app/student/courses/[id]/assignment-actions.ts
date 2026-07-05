'use server'
import { AssignmentService } from '@/services/assignment.service'
import { NotificationService } from '@/services/notification.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitAssignment(
  assignmentId: string,
  courseId: string,
  fileUrl: string
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { success: false, error: 'Institution not found.' }

  const success = await AssignmentService.submit({
    tenant_id: profile.tenant_id,
    assignment_id: assignmentId,
    student_id: user.id,
    file_url: fileUrl,
  })
  if (!success) return { success: false, error: 'Failed to submit.' }

  // Get assignment + teacher info
  const { data: assignment } = await supabase
    .from('assignments')
    .select('title, teacher_id, courses(title)')
    .eq('id', assignmentId)
    .single()

  if (assignment) {
    await NotificationService.create({
      tenant_id: profile.tenant_id,
      user_id: (assignment as any).teacher_id,
      title: 'Assignment submitted',
      message: `${profile.full_name} submitted "${assignment.title}"`,
      type: 'assignment_submitted',
      link: `/teacher/courses/${courseId}/assignments/${assignmentId}`,
      metadata: { assignmentId, courseId, studentId: user.id },
    })
  }

  revalidatePath(`/student/courses/${courseId}`)
  return { success: true }
}
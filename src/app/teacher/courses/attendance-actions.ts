'use server'

import { AttendanceService } from '@/services/attendance.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AttendanceStatus } from '@/types'
import { revalidatePath } from 'next/cache'

export async function markAttendance(
  courseId: string,
  date: string,
  records: { studentId: string; status: AttendanceStatus }[]
) {
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

  const success = await AttendanceService.markBulk(
    records.map((r) => ({
      tenant_id: profile.tenant_id!,
      student_id: r.studentId,
      course_id: courseId,
      date,
      status: r.status,
      marked_by: user.id,
    }))
  )

  if (!success) {
    return { success: false, error: 'Failed to save attendance.' }
  }

  revalidatePath(`/teacher/courses/${courseId}`)
  return { success: true }
}
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AttendanceStatus } from '@/types'

export const AttendanceService = {

  // Get attendance for a course on a specific date
  async getByCourseAndDate(courseId: string, date: string) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('course_id', courseId)
      .eq('date', date)

    if (error) return []
    return data
  },

  // Mark attendance for multiple students at once
  async markBulk(records: {
    tenant_id: string
    student_id: string
    course_id: string
    date: string
    status: AttendanceStatus
    marked_by: string
  }[]) {
    const supabase = await createServerSupabaseClient()

    // Delete existing records for this course+date first (allows re-marking)
    if (records.length > 0) {
      await supabase
        .from('attendance')
        .delete()
        .eq('course_id', records[0].course_id)
        .eq('date', records[0].date)
    }

    const { error } = await supabase.from('attendance').insert(records)
    return !error
  },

  // Get attendance history for a student in a course
  async getStudentHistory(studentId: string, courseId: string) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .order('date', { ascending: false })

    if (error) return []
    return data
  },
  // Get all attendance records for a course, grouped by date
async getCourseHistory(courseId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('attendance')
    .select('*, users!attendance_student_id_fkey(full_name)')
    .eq('course_id', courseId)
    .order('date', { ascending: false })

  if (error) return []

  // Group by date
  const grouped: Record<string, any[]> = {}
  data.forEach((record: any) => {
    if (!grouped[record.date]) grouped[record.date] = []
    grouped[record.date].push(record)
  })

  return Object.entries(grouped).map(([date, records]) => ({
    date,
    records,
    presentCount: records.filter((r) => r.status === 'present').length,
    totalCount: records.length,
  }))
},

  // Get attendance summary (% present) for a student in a course
  async getStudentSummary(studentId: string, courseId: string) {
    const records = await this.getStudentHistory(studentId, courseId)
    const total = records.length
    const present = records.filter((r) => r.status === 'present').length

    return {
      total,
      present,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  },

  // Get student's own attendance across all their courses
async getMyAttendance(studentId: string, tenantId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('attendance')
    .select('*, courses(id, title)')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })

  if (error) return []

  // Group by course
  const grouped: Record<string, any> = {}
  data.forEach((record: any) => {
    const courseId = record.course_id
    if (!grouped[courseId]) {
      grouped[courseId] = {
        courseId,
        courseTitle: record.courses?.title ?? 'Unknown',
        records: [],
      }
    }
    grouped[courseId].records.push(record)
  })

  return Object.values(grouped).map((g: any) => {
    const total = g.records.length
    const present = g.records.filter((r: any) => r.status === 'present').length
    const absent = g.records.filter((r: any) => r.status === 'absent').length
    const late = g.records.filter((r: any) => r.status === 'late').length
    return {
      ...g,
      total,
      present,
      absent,
      late,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  })
},
  
}
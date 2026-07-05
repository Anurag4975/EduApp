import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Course, CourseStatus } from '@/types'

export const CourseService = {

  // Get all courses for a teacher
  async getByTeacher(teacherId: string): Promise<Course[]> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) return []
    return data
  },

  // Get single course
  async getById(id: string): Promise<Course | null> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },
  // Get all modules with lessons for a course
async getModulesWithLessons(courseId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (!modules) return []

  const modulesWithLessons = await Promise.all(
    modules.map(async (module) => {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', module.id)
        .order('order_index', { ascending: true })

      return { ...module, lessons: lessons ?? [] }
    })
  )

  return modulesWithLessons
},
// Get all published courses for a tenant (for students to browse)
async getPublishedByTenant(tenantId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*, users!courses_teacher_id_fkey(full_name)')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) return []
  return data
},

// Get courses a student is enrolled in
async getEnrolledCourses(studentId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('enrollments')
    .select('*, courses(*, users!courses_teacher_id_fkey(full_name))')
    .eq('student_id', studentId)
    .eq('status', 'active')

  if (error) return []
  return data
},
// Get all students enrolled in a course with their progress
async getEnrolledStudents(courseId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, users!enrollments_student_id_fkey(id, full_name, email)')
    .eq('course_id', courseId)
    .eq('status', 'active')

  if (!enrollments) return []

  // Get total lessons in this course for progress calculation
  const modules = await this.getModulesWithLessons(courseId)
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)

  return enrollments.map((e: any) => ({
    id: e.id,
    studentId: e.users.id,
    fullName: e.users.full_name,
    email: e.users.email,
    enrolledAt: e.enrolled_at,
    totalLessons,
  }))
},

// Check if student is enrolled in a specific course
async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()

  return !!data
},

// Enroll a student in a course
async enroll(data: { tenant_id: string; student_id: string; course_id: string }) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('enrollments')
    .insert({
      tenant_id: data.tenant_id,
      student_id: data.student_id,
      course_id: data.course_id,
      status: 'active',
    })

  return !error
},

// Create a new module
async createModule(data: {
  tenant_id: string
  course_id: string
  title: string
  order_index: number
}) {
  const supabase = await createServerSupabaseClient()

  const { data: module, error } = await supabase
    .from('modules')
    .insert(data)
    .select()
    .single()

  if (error) return null
  return module
},

// Create a new lesson
async createLesson(data: {
  tenant_id: string
  module_id: string
  title: string
  type: 'video' | 'document' | 'text'
  content_url?: string
  order_index: number
}) {
  const supabase = await createServerSupabaseClient()

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert(data)
    .select()
    .single()

  if (error) return null
  return lesson
},

// Delete a module (cascades to lessons)
async deleteModule(moduleId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('modules').delete().eq('id', moduleId)
  return !error
},

// Delete a lesson
async deleteLesson(lessonId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
  return !error
},

  // Create new course
  async create(data: {
    tenant_id: string
    teacher_id: string
    title: string
    description: string
  }): Promise<Course | null> {
    const supabase = await createServerSupabaseClient()

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        tenant_id: data.tenant_id,
        teacher_id: data.teacher_id,
        title: data.title,
        description: data.description,
        status: 'draft' as CourseStatus,
      })
      .select()
      .single()

    if (error) return null
    return course
  },

  // Update course status (draft/published/archived)
  async updateStatus(id: string, status: CourseStatus): Promise<boolean> {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('courses')
      .update({ status })
      .eq('id', id)

    return !error
  },

  // Update course details
  async update(id: string, data: { title?: string; description?: string }): Promise<boolean> {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('courses')
      .update(data)
      .eq('id', id)

    return !error
  },

  // Get enrolled student count for a course
  async getEnrollmentCount(courseId: string): Promise<number> {
    const supabase = await createServerSupabaseClient()

    const { count } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    return count ?? 0
  },

  // Mark a lesson as complete for a student
  async markLessonComplete(studentId: string, lessonId: string, courseId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('lesson_progress')
      .upsert(
        { student_id: studentId, lesson_id: lessonId, course_id: courseId },
        { onConflict: 'student_id,lesson_id' }
      )

    return !error
  },

  // Unmark a lesson as complete
  async unmarkLessonComplete(studentId: string, lessonId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('lesson_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)

    return !error
  },

  // Get completed lesson IDs for a student in a course
  async getCompletedLessons(studentId: string, courseId: string): Promise<string[]> {
    const supabase = await createServerSupabaseClient()

    const { data } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)

    return data?.map((r) => r.lesson_id) ?? []
  },

  // Get progress percentage for a student in a course
  async getCourseProgress(studentId: string, courseId: string): Promise<number> {
    const supabase = await createServerSupabaseClient()

    // Get total lessons
    const modules = await this.getModulesWithLessons(courseId)
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
    if (totalLessons === 0) return 0

    // Get completed count
    const { count } = await supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('course_id', courseId)

    return Math.round(((count ?? 0) / totalLessons) * 100)
  },

  // Get progress for multiple courses at once (for dashboard)
  async getProgressForCourses(studentId: string, courseIds: string[]): Promise<Record<string, number>> {
    const supabase = await createServerSupabaseClient()

    const { data } = await supabase
      .from('lesson_progress')
      .select('course_id')
      .eq('student_id', studentId)
      .in('course_id', courseIds)

    const completedPerCourse: Record<string, number> = {}
    data?.forEach((r) => {
      completedPerCourse[r.course_id] = (completedPerCourse[r.course_id] ?? 0) + 1
    })

    return completedPerCourse
  },

  // Get per-lesson completion stats for teacher progress view
  async getLessonProgressStats(courseId: string) {
    const supabase = await createServerSupabaseClient()

    // Get total enrolled students
    const { count: totalStudents } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'active')

    // Get all lesson_progress rows for this course
    const { data: progressRows } = await supabase
      .from('lesson_progress')
      .select('lesson_id, student_id')
      .eq('course_id', courseId)

    // Count completions per lesson
    const completionsPerLesson: Record<string, number> = {}
    progressRows?.forEach((r) => {
      completionsPerLesson[r.lesson_id] = (completionsPerLesson[r.lesson_id] ?? 0) + 1
    })

    return {
      totalStudents: totalStudents ?? 0,
      completionsPerLesson,
    }
  },
}
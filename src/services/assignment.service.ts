import { createServerSupabaseClient } from '@/lib/supabase/server'

export type SubmissionType = 'online' | 'offline'
export type GradingType = 'graded' | 'completion_only'
export type AssignmentCategory = 'formative' | 'summative'
export type GradingScale = 'percentage' | 'gpa_4' | 'gpa_10'

export const AssignmentService = {

  // Get all assignments for a course
  async getByCourse(courseId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('due_date', { ascending: true })

    if (error) return []
    return data
  },

  // Get single assignment
  async getById(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  // Create assignment
  async create(data: {
    tenant_id: string
    course_id: string
    teacher_id: string
    title: string
    description: string
    due_date: string
    submission_type: SubmissionType
    grading_type: GradingType
    category: AssignmentCategory
    max_marks?: number
  }) {
    const supabase = await createServerSupabaseClient()
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert(data)
      .select()
      .single()

    if (error) return null
    return assignment
  },

  // Delete assignment
  async delete(id: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    return !error
  },

  // Get all submissions for an assignment (with student info)
  async getSubmissions(assignmentId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*, users!assignment_submissions_student_id_fkey(full_name, email)')
      .eq('assignment_id', assignmentId)

    if (error) return []
    return data
  },

  // Get a student's submission for a specific assignment
  async getStudentSubmission(assignmentId: string, studentId: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .maybeSingle()

    return data
  },

  // Student submits (online — with file) or marks viewed (offline)
  async submit(data: {
    tenant_id: string
    assignment_id: string
    student_id: string
    file_url?: string
  }) {
    const supabase = await createServerSupabaseClient()

    // Check if submission already exists, update instead of duplicate insert
    const existing = await this.getStudentSubmission(data.assignment_id, data.student_id)

    if (existing) {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          file_url: data.file_url,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
        })
        .eq('id', existing.id)
      return !error
    }

    const { error } = await supabase.from('assignment_submissions').insert({
      tenant_id: data.tenant_id,
      assignment_id: data.assignment_id,
      student_id: data.student_id,
      file_url: data.file_url,
      status: 'submitted',
    })

    return !error
  },

  // Teacher marks offline assignment as completed/not completed
  async markCompletion(data: {
    tenant_id: string
    assignment_id: string
    student_id: string
    is_completed: boolean
  }) {
    const supabase = await createServerSupabaseClient()

    const existing = await this.getStudentSubmission(data.assignment_id, data.student_id)

    if (existing) {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({ is_completed: data.is_completed, status: 'graded' })
        .eq('id', existing.id)
      return !error
    }

    const { error } = await supabase.from('assignment_submissions').insert({
      tenant_id: data.tenant_id,
      assignment_id: data.assignment_id,
      student_id: data.student_id,
      is_completed: data.is_completed,
      status: 'graded',
    })

    return !error
  },

  // Teacher grades a submission
  async grade(submissionId: string, gradeValue: number, feedback?: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        grade_value: gradeValue,
        feedback,
        status: 'graded',
      })
      .eq('id', submissionId)

    return !error
  },

  // Get max value for grading scale (for validation/display)
  getScaleMax(scale: GradingScale): number {
    if (scale === 'gpa_4') return 4
    if (scale === 'gpa_10') return 10
    return 100
  },

  getScaleLabel(scale: GradingScale): string {
    if (scale === 'gpa_4') return 'GPA (4.0 scale)'
    if (scale === 'gpa_10') return 'GPA (10.0 scale)'
    return 'Percentage'
  },
  async getStudentGrades(studentId: string, tenantId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      assignments(
        id, title, description, max_marks, grading_type, category, due_date,
        courses(id, title)
      )
    `)
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('submitted_at', { ascending: false })

  if (error) return []
  return data
},
}
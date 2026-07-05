'use server'
import { AssignmentService, SubmissionType, GradingType, AssignmentCategory } from '@/services/assignment.service'
import { CourseService } from '@/services/course.service'
import { NotificationService } from '@/services/notification.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAssignment(formData: {
  courseId: string
  title: string
  description: string
  dueDate: string
  submissionType: SubmissionType
  gradingType: GradingType
  category: AssignmentCategory
  maxMarks?: number
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

  const assignment = await AssignmentService.create({
    tenant_id: profile.tenant_id,
    course_id: formData.courseId,
    teacher_id: user.id,
    title: formData.title,
    description: formData.description,
    due_date: formData.dueDate,
    submission_type: formData.submissionType,
    grading_type: formData.gradingType,
    category: formData.category,
    max_marks: formData.maxMarks,
  })
  if (!assignment) return { success: false, error: 'Failed to create assignment.' }

  // Notify all enrolled students
  const enrolledStudents = await CourseService.getEnrolledStudents(formData.courseId)
  const course = await CourseService.getById(formData.courseId)
  if (enrolledStudents.length > 0) {
    await NotificationService.createBulk({
      tenant_id: profile.tenant_id,
      user_ids: enrolledStudents.map((s) => s.studentId),
      title: 'New assignment posted',
      message: `"${formData.title}" has been posted in ${course?.title ?? 'your course'}`,
      type: 'assignment_created',
      link: `/student/courses/${formData.courseId}`,
      metadata: { courseId: formData.courseId, assignmentId: assignment.id },
    })
  }

  revalidatePath(`/teacher/courses/${formData.courseId}`)
  return { success: true, assignmentId: assignment.id }
}

export async function deleteAssignment(assignmentId: string, courseId: string) {
  await AssignmentService.delete(assignmentId)
  revalidatePath(`/teacher/courses/${courseId}`)
}

export async function gradeSubmission(submissionId: string, gradeValue: number, feedback: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Get submission to find student and assignment info
  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('*, assignments(title, course_id, max_marks, courses(title))')
    .eq('id', submissionId)
    .single()

  await AssignmentService.grade(submissionId, gradeValue, feedback)

  // Notify student
  if (submission) {
    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const assignment = (submission as any).assignments
    const courseId = assignment?.course_id

    await NotificationService.create({
      tenant_id: profile?.tenant_id,
      user_id: submission.student_id,
      title: 'Assignment graded',
      message: `Your submission for "${assignment?.title}" scored ${gradeValue}/${assignment?.max_marks}`,
      type: 'assignment_graded',
      link: `/student/grades`,
      metadata: { submissionId, assignmentId: submission.assignment_id, courseId },
    })
  }

  revalidatePath('/teacher/courses')
}

export async function markOfflineComplete(data: {
  tenantId: string
  assignmentId: string
  studentId: string
  isCompleted: boolean
}) {
  const supabase = await createServerSupabaseClient()
  await AssignmentService.markCompletion({
    tenant_id: data.tenantId,
    assignment_id: data.assignmentId,
    student_id: data.studentId,
    is_completed: data.isCompleted,
  })

  // Notify student if marked complete
  if (data.isCompleted) {
    const { data: assignment } = await supabase
      .from('assignments')
      .select('title, course_id')
      .eq('id', data.assignmentId)
      .single()

    if (assignment) {
      await NotificationService.create({
        tenant_id: data.tenantId,
        user_id: data.studentId,
        title: 'Assignment marked complete',
        message: `"${assignment.title}" has been marked as completed`,
        type: 'assignment_graded',
        link: `/student/grades`,
        metadata: { assignmentId: data.assignmentId, courseId: assignment.course_id },
      })
    }
  }

  revalidatePath('/teacher/courses')
}
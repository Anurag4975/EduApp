'use server'

import { AssignmentService } from '@/services/assignment.service'
import { revalidatePath } from 'next/cache'

export async function gradeSubmission(submissionId: string, gradeValue: number, feedback: string) {
  await AssignmentService.grade(submissionId, gradeValue, feedback)
  revalidatePath('/teacher/courses')
}

export async function markOfflineComplete(data: {
  tenantId: string
  assignmentId: string
  studentId: string
  isCompleted: boolean
}) {
  await AssignmentService.markCompletion({
    tenant_id: data.tenantId,
    assignment_id: data.assignmentId,
    student_id: data.studentId,
    is_completed: data.isCompleted,
  })
  revalidatePath('/teacher/courses')
}
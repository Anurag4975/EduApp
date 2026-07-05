import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AssignmentService } from '@/services/assignment.service'
import { CourseService } from '@/services/course.service'
import GradingView from './GradingView'

export default async function AssignmentGradingPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>
}) {
  const { id: courseId, assignmentId } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const assignment = await AssignmentService.getById(assignmentId)
  if (!assignment) redirect(`/teacher/courses/${courseId}`)

  const submissions = await AssignmentService.getSubmissions(assignmentId)
  const enrolledStudents = await CourseService.getEnrolledStudents(courseId)

  // Get grading scale from tenant settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('grading_scale')
    .eq('id', profile.tenant_id)
    .single()

  const gradingScale = tenant?.grading_scale ?? 'percentage'
  const scaleMax = AssignmentService.getScaleMax(gradingScale)
  const scaleLabel = AssignmentService.getScaleLabel(gradingScale)

  return (
    <GradingView
      courseId={courseId}
      assignment={assignment}
      submissions={submissions}
      enrolledStudents={enrolledStudents}
      tenantId={profile.tenant_id}
      scaleMax={scaleMax}
      scaleLabel={scaleLabel}
    />
  )
}
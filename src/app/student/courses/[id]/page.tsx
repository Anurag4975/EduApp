import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CourseService } from '@/services/course.service'
import { AssignmentService } from '@/services/assignment.service'
import { TenantService } from '@/services/tenant.service'
import { QuizService } from '@/services/quiz.service'
import CoursePageTabs from './CoursePageTabs'

export default async function StudentCourseViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check enrolment early
  const isEnrolled = await CourseService.isEnrolled(user.id, id)
  if (!isEnrolled) redirect('/student/courses')

  const course = await CourseService.getById(id)
  if (!course) redirect('/student/courses')

  // ---- Optimised: fetch all independent data in parallel ----
  const [
    profile,
    modules,
    completedLessonIds,
    assignments,
    quizzes,
  ] = await Promise.all([
    supabase.from('users').select('tenant_id, full_name, email').eq('id', user.id).single()
      .then(({ data }) => data),
    CourseService.getModulesWithLessons(id),
    CourseService.getCompletedLessons(user.id, id),
    AssignmentService.getByCourse(id),
    QuizService.getByCourseWithCount(id),
  ])

  // Derived progress
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedCount = completedLessonIds.length
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  // Enrich assignments with submissions (can be parallelised with Promise.all inside map)
  const assignmentsWithSubmission = await Promise.all(
    assignments.map(async (a) => ({
      ...a,
      submission: await AssignmentService.getStudentSubmission(a.id, user.id),
    }))
  )

  // Enrich quizzes with attempts (parallel)
  const quizzesWithAttempts = await Promise.all(
    quizzes.map(async (q: any) => ({
      ...q,
      attempt: await QuizService.getAttempt(q.id, user.id),
    }))
  )

  // Grading scale label
  const gradingScale = profile?.tenant_id
    ? await TenantService.getGradingScale(profile.tenant_id)
    : 'percentage'
  const scaleLabel = AssignmentService.getScaleLabel(gradingScale as any)

  return (
    <div style={{ maxWidth: '800px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header with course info and progress bar */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          {course.title}
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '6px' }}>
          {course.description}
        </p>

        {totalLessons > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Your Progress
              </span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {completedCount}/{totalLessons} lessons · {progress}%
              </span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '999px', height: '8px' }}>
              <div
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? '#16a34a' : '#6366f1',
                  borderRadius: '999px',
                  height: '8px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            {progress === 100 && (
              <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', marginTop: '8px' }}>
                🎉 Course complete!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabs: Content, Assignments, Quizzes */}
      <CoursePageTabs
        courseId={id}
        modules={modules}
        completedLessonIds={completedLessonIds}
        assignments={assignmentsWithSubmission}
        scaleLabel={scaleLabel}
        quizzes={quizzesWithAttempts}
        assignmentCount={assignmentsWithSubmission.length}
        quizCount={quizzesWithAttempts.length}
        studentEmail={profile?.email ?? ''}
        studentName={profile?.full_name ?? ''}
      />
    </div>
  )
}
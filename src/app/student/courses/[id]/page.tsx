import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CourseService } from '@/services/course.service'
import { AssignmentService } from '@/services/assignment.service'
import { TenantService } from '@/services/tenant.service'
import { QuizService } from '@/services/quiz.service'
import LessonViewer from './LessonViewer'
import AssignmentList from './AssignmentList'
import QuizList from './QuizList'
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

  const isEnrolled = await CourseService.isEnrolled(user.id, id)
  if (!isEnrolled) redirect('/student/courses')

  const course = await CourseService.getById(id)
  if (!course) redirect('/student/courses')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const modules = await CourseService.getModulesWithLessons(id)
  const completedLessonIds = await CourseService.getCompletedLessons(user.id, id)
  const progress = await CourseService.getCourseProgress(user.id, id)
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedCount = completedLessonIds.length

  const assignments = await AssignmentService.getByCourse(id)
  const assignmentsWithSubmission = await Promise.all(
    assignments.map(async (a) => ({
      ...a,
      submission: await AssignmentService.getStudentSubmission(a.id, user.id),
    }))
  )

  const gradingScale = profile?.tenant_id
    ? await TenantService.getGradingScale(profile.tenant_id)
    : 'percentage'
  const scaleLabel = AssignmentService.getScaleLabel(gradingScale as any)

  const quizzes = await QuizService.getByCourseWithCount(id)
  const quizzesWithAttempts = await Promise.all(
    quizzes.map(async (q: any) => ({
      ...q,
      attempt: await QuizService.getAttempt(q.id, user.id),
    }))
  )

  return (
    <div style={{ maxWidth: '800px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Course Header */}
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
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Your Progress</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {completedCount}/{totalLessons} lessons · {progress}%
              </span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '999px', height: '8px' }}>
              <div style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#16a34a' : '#6366f1',
                borderRadius: '999px',
                height: '8px',
                transition: 'width 0.4s ease',
              }} />
            </div>
            {progress === 100 && (
              <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', marginTop: '8px' }}>
                🎉 Course complete!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabbed Content */}
      <CoursePageTabs
        courseId={id}
        modules={modules}
        completedLessonIds={completedLessonIds}
        assignments={assignmentsWithSubmission}
        scaleLabel={scaleLabel}
        quizzes={quizzesWithAttempts}
        assignmentCount={assignments.length}
        quizCount={quizzes.length}
      />
    </div>
  )
}
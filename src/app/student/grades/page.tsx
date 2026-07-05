import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AssignmentService } from '@/services/assignment.service'
import { TenantService } from '@/services/tenant.service'
import { QuizService } from '@/services/quiz.service'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import GradesTabs from './GradesTabs'

export default async function StudentGradesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const grades = await AssignmentService.getStudentGrades(user.id, profile.tenant_id)
  const quizResults = await QuizService.getStudentResults(user.id, profile.tenant_id)
  const gradingScale = await TenantService.getGradingScale(profile.tenant_id)
  const scaleLabel = AssignmentService.getScaleLabel(gradingScale as any)
  const scaleMax = AssignmentService.getScaleMax(gradingScale as any)

  // Overall stats
  const gradedSubmissions = grades.filter((g: any) =>
    g.assignments?.grading_type === 'graded' && g.grade_value != null
  )
  const gradedQuizzes = quizResults.filter((r: any) => r.score != null)

  const allPercentages = [
    ...gradedSubmissions.map((g: any) =>
      Math.round((g.grade_value / (g.assignments?.max_marks ?? scaleMax)) * 100)
    ),
    ...gradedQuizzes.map((r: any) =>
      Math.round((r.score / (r.quizzes?.total_marks ?? 100)) * 100)
    ),
  ]

  const avgGrade = allPercentages.length > 0
    ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
    : null

  const completedAssignments = grades.filter((g: any) =>
    g.status === 'graded' || g.is_completed
  ).length

  return (
    <div style={{ maxWidth: '900px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <PageHeader title="My Grades" subtitle="Track your performance across all courses" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#6366f1', margin: 0 }}>
            {avgGrade != null ? `${avgGrade}%` : '—'}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Overall Average
          </p>
        </Card>
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', margin: 0 }}>
            {completedAssignments}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Assignments Done
          </p>
        </Card>
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#6366f1', margin: 0 }}>
            {quizResults.length}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quizzes Done
          </p>
        </Card>
      </div>

      {/* Empty */}
      {grades.length === 0 && quizResults.length === 0 && (
        <Card style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            No grades yet — submit assignments or complete quizzes to see them here.
          </p>
        </Card>
      )}

      {/* Tabbed content */}
      {(grades.length > 0 || quizResults.length > 0) && (
        <GradesTabs
          grades={grades}
          quizResults={quizResults}
          scaleLabel={scaleLabel}
          scaleMax={scaleMax}
        />
      )}
    </div>
  )
}
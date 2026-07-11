import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import StatCard from '@/components/ui/StatCard'
import StatsGrid from '@/components/ui/StatsGrid'

export default async function TeacherDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  // Get teacher's courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, status')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const courseIds = courses?.map((c) => c.id) ?? []

  // Run everything in parallel
  const [
    enrollmentResult,
    pendingSubmissions,
    upcomingAssignments,
    recentQuizAttempts,
  ] = await Promise.all([
    // Total students across all courses
    courseIds.length > 0
      ? supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .in('course_id', courseIds)
          .eq('status', 'active')
      : Promise.resolve({ count: 0 }),

    // Ungraded submissions
    courseIds.length > 0
      ? supabase
          .from('assignment_submissions')
          .select('id, assignments!inner(title, course_id, courses!inner(title))')
          .in('assignments.course_id', courseIds)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    // Upcoming assignment due dates
    courseIds.length > 0
      ? supabase
          .from('assignments')
          .select('id, title, due_date, course_id, courses!inner(title)')
          .in('course_id', courseIds)
          .gte('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] }),

    // Recent quiz attempts
    courseIds.length > 0
      ? supabase
          .from('quiz_attempts')
          .select('id, score, completed_at, quizzes!inner(title, total_marks, course_id, courses!inner(title)), users!quiz_attempts_student_id_fkey(full_name)')
          .in('quizzes.course_id', courseIds)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ])

  const studentCount = enrollmentResult.count ?? 0
  const publishedCount = courses?.filter((c) => c.status === 'published').length ?? 0
  const pendingCount = (pendingSubmissions.data ?? []).length

  const statusColors: Record<string, { bg: string; color: string }> = {
    published: { bg: '#dcfce7', color: '#16a34a' },
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    archived: { bg: '#fee2e2', color: '#dc2626' },
  }

  return (
    <div style={{ maxWidth: '1100px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Welcome, {profile.full_name}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Here's an overview of your teaching
          </p>
        </div>
        <Link
          href="/teacher/courses"
          style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
        >
          My Courses →
        </Link>
      </div>

      {/* Pending submissions alert */}
      {pendingCount > 0 && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#92400e' }}>
            📋 <strong>{pendingCount} submission{pendingCount > 1 ? 's' : ''}</strong> waiting to be graded
          </span>
          <Link href="/teacher/courses" style={{ fontSize: '13px', color: '#92400e', fontWeight: '600', textDecoration: 'underline' }}>
            Grade now →
          </Link>
        </div>
      )}

      {/* Stats */}
      <StatsGrid>
        <StatCard label="My Courses" value={courses?.length ?? 0} icon="📚" color="#f59e0b" bg="#fffbeb" />
        <StatCard label="Published" value={publishedCount} icon="✅" color="#16a34a" bg="#f0fdf4" />
        <StatCard label="Total Students" value={studentCount} icon="🎓" color="#10b981" bg="#f0fdf4" />
        <StatCard label="Pending Grades" value={pendingCount} icon="📋" color="#f59e0b" bg="#fffbeb" />
      </StatsGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>

        {/* My Courses */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>My Courses</h2>
            <Link href="/teacher/courses" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: '12px' }}>
            {(courses ?? []).length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 10px 0' }}>No courses yet</p>
                <Link href="/teacher/courses" style={{ fontSize: '13px', color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
                  Create your first course →
                </Link>
              </div>
            ) : (
              courses?.slice(0, 5).map((course) => (
                <Link
                  key={course.id}
                  href={`/teacher/courses/${course.id}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '4px' }}
                >
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    {course.title}
                  </p>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600',
                    textTransform: 'capitalize',
                    backgroundColor: statusColors[course.status]?.bg ?? '#f3f4f6',
                    color: statusColors[course.status]?.color ?? '#6b7280',
                  }}>
                    {course.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Due Dates */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Upcoming Due Dates</h2>
          </div>
          <div style={{ padding: '12px' }}>
            {(upcomingAssignments.data ?? []).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', padding: '16px', textAlign: 'center', margin: 0 }}>
                No upcoming due dates
              </p>
            ) : (
              (upcomingAssignments.data ?? []).map((a: any) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{a.title}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>{a.courses?.title}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {new Date(a.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Submissions */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Pending Submissions</h2>
          </div>
          <div style={{ padding: '12px' }}>
            {(pendingSubmissions.data ?? []).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', padding: '16px', textAlign: 'center', margin: 0 }}>
                No pending submissions 🎉
              </p>
            ) : (
              (pendingSubmissions.data ?? []).map((s: any) => (
                <Link
                  key={s.id}
                  href={`/teacher/courses/${s.assignments?.course_id}/assignments/${s.assignments?.id}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '4px' }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {s.assignments?.title}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                      {s.assignments?.courses?.title}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600' }}>Grade →</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Quiz Results */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Recent Quiz Results</h2>
          </div>
          <div style={{ padding: '12px' }}>
            {(recentQuizAttempts.data ?? []).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', padding: '16px', textAlign: 'center', margin: 0 }}>
                No quiz attempts yet
              </p>
            ) : (
              (recentQuizAttempts.data ?? []).map((a: any) => {
                const pct = a.quizzes?.total_marks
                  ? Math.round((a.score / a.quizzes.total_marks) * 100)
                  : 0
                const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#dc2626'
                return (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {a.users?.full_name}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                        {a.quizzes?.title} · {a.quizzes?.courses?.title}
                      </p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {a.score}/{a.quizzes?.total_marks} ({pct}%)
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
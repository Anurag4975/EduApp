import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CourseService } from '@/services/course.service'
import { FeeService } from '@/services/fee.service'

export default async function StudentDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const [enrollments, feeSummary, feeSettings] = await Promise.all([
    CourseService.getEnrolledCourses(user.id),
    FeeService.getStudentFeeSummary(user.id, profile.tenant_id),
    FeeService.getFeeSettings(profile.tenant_id),
  ])

  const symbol = feeSettings?.fee_currency_symbol ?? '₹'
  const fmt = (n: number) => `${symbol}${Number(n).toLocaleString('en-IN')}`

  // Fee banners
  const overdueFees = feeSummary.filter((f: any) => f.status === 'overdue')
  const dueSoonFees = feeSummary.filter((f: any) => {
    if (f.status === 'paid' || f.status === 'waived' || f.status === 'overdue') return false
    const daysUntilDue = Math.ceil((new Date(f.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilDue <= 7 && daysUntilDue >= 0
  })
  const overdueTotal = overdueFees.reduce((sum: number, f: any) => sum + Number(f.balance), 0)

  // Course progress
  const courseIds = enrollments.map((e: any) => e.courses.id)
  const progressList = await Promise.all(
    courseIds.map((id: string) => CourseService.getCourseProgress(user.id, id))
  )
  const progressMap: Record<string, number> = {}
  courseIds.forEach((id: string, i: number) => { progressMap[id] = progressList[i] })

  const totalCourses = enrollments.length
  const completedCourses = Object.values(progressMap).filter((p) => p === 100).length
  const inProgressCourses = Object.values(progressMap).filter((p) => p > 0 && p < 100).length

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Welcome, {profile.full_name}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Continue your learning journey</p>
        </div>
        <Link href="/student/courses" style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          Browse Courses
        </Link>
      </div>

      {/* Fee Banners */}
      {overdueFees.length > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#991b1b' }}>
            ⚠️ You have <strong>{fmt(overdueTotal)}</strong> in overdue fees
          </span>
          <Link href="/student/fees" style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600', textDecoration: 'underline' }}>
            View fees →
          </Link>
        </div>
      )}
      {dueSoonFees.length > 0 && overdueFees.length === 0 && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#92400e' }}>
            📋 You have <strong>{dueSoonFees.length} fee{dueSoonFees.length > 1 ? 's' : ''}</strong> due within 7 days
          </span>
          <Link href="/student/fees" style={{ fontSize: '13px', color: '#92400e', fontWeight: '600', textDecoration: 'underline' }}>
            View fees →
          </Link>
        </div>
      )}

      {/* Stats Row */}
      {totalCourses > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Enrolled', value: totalCourses, color: '#6366f1', bg: '#eef2ff' },
            { label: 'In Progress', value: inProgressCourses, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Completed', value: completedCourses, color: '#16a34a', bg: '#dcfce7' },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: stat.bg, borderRadius: '12px', padding: '14px 16px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: stat.color, display: 'block' }}>{stat.value}</span>
              <span style={{ fontSize: '12px', color: stat.color, fontWeight: '500' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Course Cards */}
      <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '14px' }}>My Courses</h2>

      {enrollments.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>You haven't enrolled in any courses yet.</p>
          <Link href="/student/courses" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
            Browse available courses →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {enrollments.map((enrollment: any) => {
            const course = enrollment.courses
            const progress = progressMap[course.id] ?? 0
            const isCompleted = progress === 100

            return (
              <Link
                key={enrollment.id}
                href={`/student/courses/${course.id}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: `1px solid ${isCompleted ? '#bbf7d0' : '#f3f4f6'}`,
                  padding: '18px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {isCompleted && (
                  <span style={{ alignSelf: 'flex-start', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                    ✓ Completed
                  </span>
                )}
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>{course.title}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{course.description}</p>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: isCompleted ? '#16a34a' : '#6366f1' }}>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '999px', height: '6px' }}>
                    <div style={{ width: `${progress}%`, backgroundColor: isCompleted ? '#16a34a' : '#6366f1', borderRadius: '999px', height: '6px' }} />
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>👨‍🏫 {course.users?.full_name ?? 'Unknown teacher'}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
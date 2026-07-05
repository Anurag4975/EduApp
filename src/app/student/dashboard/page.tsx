import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CourseService } from '@/services/course.service'

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

  const enrollments = await CourseService.getEnrolledCourses(user.id)

  // Fetch progress for all enrolled courses in parallel
  const courseIds = enrollments.map((e: any) => e.courses.id)
  const progressList = await Promise.all(
    courseIds.map((id: string) => CourseService.getCourseProgress(user.id, id))
  )

  // Map courseId -> progress %
  const progressMap: Record<string, number> = {}
  courseIds.forEach((id: string, i: number) => {
    progressMap[id] = progressList[i]
  })

  const totalCourses = enrollments.length
  const completedCourses = Object.values(progressMap).filter((p) => p === 100).length
  const inProgressCourses = Object.values(progressMap).filter((p) => p > 0 && p < 100).length

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Welcome, {profile.full_name}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Continue your learning journey</p>
        </div>
        <Link
          href="/student/courses"
          style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
        >
          Browse Courses
        </Link>
      </div>

      {/* Stats Row */}
      {totalCourses > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Enrolled', value: totalCourses, color: '#6366f1', bg: '#eef2ff' },
            { label: 'In Progress', value: inProgressCourses, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Completed', value: completedCourses, color: '#16a34a', bg: '#dcfce7' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: stat.bg,
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: '700', color: stat.color }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '13px', color: stat.color, fontWeight: '500' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Course Cards */}
      <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        My Courses
      </h2>

      {enrollments.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>
            You haven't enrolled in any courses yet.
          </p>
          <Link href="/student/courses" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
            Browse available courses →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
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
                  padding: '20px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                {/* Completed badge */}
                {isCompleted && (
                  <span style={{
                    alignSelf: 'flex-start',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                  }}>
                    ✓ Completed
                  </span>
                )}

                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                  {course.description}
                </p>

                {/* Progress Bar */}
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: isCompleted ? '#16a34a' : '#6366f1' }}>
                      {progress}%
                    </span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '999px', height: '6px' }}>
                    <div
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isCompleted ? '#16a34a' : '#6366f1',
                        borderRadius: '999px',
                        height: '6px',
                      }}
                    />
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: 'auto', margin: 0 }}>
                  👨‍🏫 {course.users?.full_name ?? 'Unknown teacher'}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
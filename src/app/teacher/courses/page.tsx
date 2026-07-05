import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CourseService } from '@/services/course.service'

export default async function TeacherCoursesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const courses = await CourseService.getByTeacher(user.id)

  const coursesWithCounts = await Promise.all(
    courses.map(async (course) => ({
      ...course,
      studentCount: await CourseService.getEnrollmentCount(course.id),
    }))
  )

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    published: { bg: '#dcfce7', color: '#16a34a' },
    archived: { bg: '#fee2e2', color: '#dc2626' },
  }

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>My Courses</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Manage your courses and content</p>
        </div>
              </div>

      {coursesWithCounts.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>You haven't created any courses yet.</p>
          <Link href="/teacher/courses/new" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
            Create your first course →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {coursesWithCounts.map((course) => (
            <Link
              key={course.id}
              href={`/teacher/courses/${course.id}`}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #f3f4f6',
                padding: '20px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>{course.title}</h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: statusColors[course.status].bg,
                    color: statusColors[course.status].color,
                    textTransform: 'capitalize',
                  }}
                >
                  {course.status}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                {course.description || 'No description added.'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9ca3af', marginTop: 'auto' }}>
                <span>🎓</span>
                <span>{course.studentCount} students enrolled</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
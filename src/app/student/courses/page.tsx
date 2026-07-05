import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CourseService } from '@/services/course.service'
import EnrollButton from './EnrollButton'

export default async function BrowseCoursesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const courses = await CourseService.getPublishedByTenant(profile.tenant_id)

  // Check enrollment status for each course
  const enrollmentChecks = await Promise.all(
    courses.map((c: any) => CourseService.isEnrolled(user.id, c.id))
  )
  const enrolledMap: Record<string, boolean> = {}
  courses.forEach((c: any, i: number) => {
    enrolledMap[c.id] = enrollmentChecks[i]
  })

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Browse Courses
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Explore and enroll in available courses
        </p>
      </div>

      {courses.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No courses available yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {courses.map((course: any) => (
            <div
              key={course.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #f3f4f6',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                {course.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                {course.description}
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                👨‍🏫 {course.users?.full_name ?? 'Unknown teacher'}
              </p>

              <EnrollButton courseId={course.id} isEnrolled={enrolledMap[course.id]} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
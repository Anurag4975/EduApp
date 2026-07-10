import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TenantService } from '@/services/tenant.service'
import { GroupService } from '@/services/group.service'
import { ProfileService } from '@/services/profile.service'
import StatCard from '@/components/ui/StatCard'
import StatsGrid from '@/components/ui/StatsGrid'

export default async function InstitutionDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', profile.tenant_id)
    .single()

  // Fetch everything in parallel
  const [
    stats,
    groups,
    memberCounts,
    incompleteProfileCount,
    recentStudents,
    recentCourses,
  ] = await Promise.all([
    TenantService.getInstitutionStats(profile.tenant_id),
    GroupService.getByTenant(profile.tenant_id),
    GroupService.getMemberCounts(profile.tenant_id),
    ProfileService.getIncompleteProfileCount(profile.tenant_id),
    supabase
      .from('users')
      .select('id, full_name, email, created_at')
      .eq('tenant_id', profile.tenant_id)
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('courses')
      .select('id, title, status, created_at, users!courses_teacher_id_fkey(full_name)')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Get at-risk students across all groups
  const atRiskByGroup = await Promise.all(
    groups.slice(0, 5).map(async (g: any) => {
      const atRisk = await GroupService.getAtRiskStudents(g.id)
      return { group: g, atRisk }
    })
  )
  const totalAtRisk = atRiskByGroup.reduce((sum, g) => sum + g.atRisk.length, 0)

  const statusColors: Record<string, { bg: string; color: string }> = {
    published: { bg: '#dcfce7', color: '#16a34a' },
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    archived: { bg: '#fee2e2', color: '#dc2626' },
  }

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>
            {tenant?.name ?? 'Your Institution'}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Welcome back, {profile.full_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/institution/students/new" style={{ padding: '10px 18px', backgroundColor: '#ffffff', color: '#6366f1', border: '1.5px solid #6366f1', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            + Add Student
          </Link>
          <Link href="/institution/teachers/new" style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            + Add Teacher
          </Link>
        </div>
      </div>

      {/* Alert Banners */}
      {(incompleteProfileCount > 0 || totalAtRisk > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {incompleteProfileCount > 0 && (
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#92400e' }}>
                ⚠️ <strong>{incompleteProfileCount} student{incompleteProfileCount > 1 ? 's' : ''}</strong> {incompleteProfileCount > 1 ? 'have' : 'has'} incomplete profiles
              </span>
              <Link href="/institution/students" style={{ fontSize: '13px', color: '#92400e', fontWeight: '600', textDecoration: 'underline' }}>
                View students →
              </Link>
            </div>
          )}
          {totalAtRisk > 0 && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#991b1b' }}>
                🔴 <strong>{totalAtRisk} student{totalAtRisk > 1 ? 's' : ''}</strong> {totalAtRisk > 1 ? 'are' : 'is'} at risk across your groups
              </span>
              <Link href="/institution/groups" style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600', textDecoration: 'underline' }}>
                View groups →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <StatsGrid>
        <StatCard label="Teachers" value={stats.totalTeachers} icon="👨‍🏫" color="#0ea5e9" bg="#f0f9ff" />
        <StatCard label="Students" value={stats.totalStudents} icon="🎓" color="#10b981" bg="#f0fdf4" />
        <StatCard label="Courses" value={stats.totalCourses} icon="📚" color="#f59e0b" bg="#fffbeb" />
        <StatCard label="Groups" value={groups.length} icon="👥" color="#6366f1" bg="#eef2ff" />
      </StatsGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>

        {/* Groups Overview */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Groups</h2>
            <Link href="/institution/groups" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: '12px' }}>
            {groups.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 12px 0' }}>No groups yet</p>
                <Link href="/institution/groups/new" style={{ fontSize: '13px', color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
                  Create your first group →
                </Link>
              </div>
            ) : (
              groups.slice(0, 5).map((group: any) => {
                const count = memberCounts[group.id] ?? 0
                const atRiskEntry = atRiskByGroup.find((g) => g.group.id === group.id)
                const atRiskCount = atRiskEntry?.atRisk.length ?? 0

                return (
                  <Link
                    key={group.id}
                    href={`/institution/groups/${group.id}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '4px' }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{group.name}</p>
                      {group.academic_session && (
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>{group.academic_session}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {atRiskCount > 0 && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '600' }}>
                          {atRiskCount} at risk
                        </span>
                      )}
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#eef2ff', color: '#6366f1', fontWeight: '600' }}>
                        {count} students
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Courses */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Recent Courses</h2>
            <Link href="/institution/courses" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: '12px' }}>
            {(recentCourses.data ?? []).length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No courses yet</p>
              </div>
            ) : (
              (recentCourses.data ?? []).map((course: any) => (
                <div
                  key={course.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px' }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{course.title}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                      {course.users?.full_name ?? 'Unknown teacher'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    backgroundColor: statusColors[course.status]?.bg ?? '#f3f4f6',
                    color: statusColors[course.status]?.color ?? '#6b7280',
                  }}>
                    {course.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Recent Students</h2>
            <Link href="/institution/students" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: '12px' }}>
            {(recentStudents.data ?? []).length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 12px 0' }}>No students yet</p>
                <Link href="/institution/students/new" style={{ fontSize: '13px', color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
                  Add your first student →
                </Link>
              </div>
            ) : (
              (recentStudents.data ?? []).map((student: any) => (
                <Link
                  key={student.id}
                  href={`/institution/students/${student.id}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '4px' }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{student.full_name}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>{student.email}</p>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {new Date(student.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 14px 0' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { href: '/institution/students/new', icon: '🎓', label: 'Add new student' },
              { href: '/institution/teachers/new', icon: '👨‍🏫', label: 'Add new teacher' },
              { href: '/institution/groups/new', icon: '👥', label: 'Create a group' },
              { href: '/institution/courses', icon: '📚', label: 'View all courses' },
              { href: '/institution/settings', icon: '⚙️', label: 'Institution settings' },
              { href: '/calendar', icon: '📅', label: 'View calendar' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#f9fafb', textDecoration: 'none', fontSize: '13px', fontWeight: '500', color: '#374151' }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
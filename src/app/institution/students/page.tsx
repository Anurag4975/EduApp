import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserService } from '@/services/user.service'
import { ProfileService } from '@/services/profile.service'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'

export default async function StudentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const students = await UserService.getByRole(profile.tenant_id, 'student')

  // Fetch all profiles for completion %
  const profiles = await ProfileService.getByTenant(profile.tenant_id)
  const profileMap: Record<string, any> = {}
  profiles.forEach((p: any) => { profileMap[p.user_id] = p })

  const rows = students.map((s) => {
    const studentProfile = profileMap[s.id]
    const completion = ProfileService.getCompletionPercentage(studentProfile)
    const completionColor = completion >= 80 ? '#16a34a' : completion >= 50 ? '#f59e0b' : '#dc2626'

    return {
      name: (
        <div>
          <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{s.full_name}</p>
          {studentProfile?.student_id_number && (
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>
              {studentProfile.student_id_number}
            </p>
          )}
        </div>
      ),
      email: s.email,
      status: <StatusBadge active={s.is_active} />,
      profile: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '11px', color: completionColor, fontWeight: '600' }}>
                {completion}%
              </span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '999px', height: '4px' }}>
              <div style={{
                width: `${completion}%`,
                backgroundColor: completionColor,
                borderRadius: '999px',
                height: '4px',
              }} />
            </div>
          </div>
          <Link
            href={`/institution/students/${s.id}`}
            style={{
              fontSize: '12px',
              color: '#6366f1',
              textDecoration: 'none',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            Edit Profile →
          </Link>
        </div>
      ),
      joined: new Date(s.created_at).toLocaleDateString(),
    }
  })

  const incompleteCount = students.filter((s) => {
    const p = profileMap[s.id]
    return ProfileService.getCompletionPercentage(p) < 100
  }).length

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>Students</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Manage enrolled students</p>
        </div>
        <Link
          href="/institution/students/new"
          style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
        >
          + Add Student
        </Link>
      </div>

      {/* Incomplete profiles warning */}
      {incompleteCount > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#92400e',
        }}>
          ⚠️ <strong>{incompleteCount} student{incompleteCount > 1 ? 's' : ''}</strong> {incompleteCount > 1 ? 'have' : 'has'} incomplete profiles. Click "Edit Profile" to fill in missing details.
        </div>
      )}

      <DataTable
        title="All Students"
        columns={[
          { header: 'Name', key: 'name' },
          { header: 'Email', key: 'email' },
          { header: 'Status', key: 'status' },
          { header: 'Profile', key: 'profile' },
          { header: 'Joined', key: 'joined' },
        ]}
        rows={rows}
        emptyText="No students added yet."
        emptyLinkText="Add your first student →"
        emptyLinkHref="/institution/students/new"
      />
    </div>
  )
}
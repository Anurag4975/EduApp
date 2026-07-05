import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserService } from '@/services/user.service'
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

  const rows = students.map((s) => ({
    name: <span style={{ fontWeight: 500, color: '#111827' }}>{s.full_name}</span>,
    email: s.email,
    status: <StatusBadge active={s.is_active} />,
    joined: new Date(s.created_at).toLocaleDateString(),
  }))

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
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

      <DataTable
        title="All Students"
        columns={[
          { header: 'Name', key: 'name' },
          { header: 'Email', key: 'email' },
          { header: 'Status', key: 'status' },
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
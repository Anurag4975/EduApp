import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserService } from '@/services/user.service'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import PageHeader from '@/components/ui/PageHeader'

export default async function TeachersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const teachers = await UserService.getByRole(profile.tenant_id, 'teacher')

  const rows = teachers.map((t) => ({
    name: <span style={{ fontWeight: 500, color: '#111827' }}>{t.full_name}</span>,
    email: t.email,
    status: <StatusBadge active={t.is_active} />,
    joined: new Date(t.created_at).toLocaleDateString(),
  }))

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <PageHeader
        title="Teachers"
        subtitle="Manage your teaching staff"
        actionLabel="+ Add Teacher"
        actionHref="/institution/teachers/new"
      />

      <DataTable
        title="All Teachers"
        columns={[
          { header: 'Name', key: 'name' },
          { header: 'Email', key: 'email' },
          { header: 'Status', key: 'status' },
          { header: 'Joined', key: 'joined' },
        ]}
        rows={rows}
        emptyText="No teachers added yet."
        emptyLinkText="Add your first teacher →"
        emptyLinkHref="/institution/teachers/new"
      />
    </div>
  )
}
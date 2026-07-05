import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserService } from '@/services/user.service'
import DataTable from '@/components/ui/DataTable'

export default async function InstitutionCoursesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const { data: courses } = await supabase
    .from('courses')
    .select('*, users!courses_teacher_id_fkey(full_name)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    published: { bg: '#dcfce7', color: '#16a34a' },
    archived: { bg: '#fee2e2', color: '#dc2626' },
  }

  const rows = (courses ?? []).map((c: any) => ({
    title: <span style={{ fontWeight: 500, color: '#111827' }}>{c.title}</span>,
    teacher: c.users?.full_name ?? 'Unassigned',
    status: (
      <span
        style={{
          fontSize: '12px',
          fontWeight: '600',
          padding: '4px 10px',
          borderRadius: '20px',
          backgroundColor: statusColors[c.status]?.bg,
          color: statusColors[c.status]?.color,
          textTransform: 'capitalize',
        }}
      >
        {c.status}
      </span>
    ),
    created: new Date(c.created_at).toLocaleDateString(),
  }))

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>Courses</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Create courses and assign teachers</p>
        </div>
        <Link
          href="/institution/courses/new"
          style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
        >
          + Create Course
        </Link>
      </div>

      <DataTable
        title="All Courses"
        columns={[
          { header: 'Title', key: 'title' },
          { header: 'Teacher', key: 'teacher' },
          { header: 'Status', key: 'status' },
          { header: 'Created', key: 'created' },
        ]}
        rows={rows}
        emptyText="No courses created yet."
        emptyLinkText="Create your first course →"
        emptyLinkHref="/institution/courses/new"
      />
    </div>
  )
}
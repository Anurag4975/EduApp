import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserService } from '@/services/user.service'
import PageHeader from '@/components/ui/PageHeader'

const PAGE_SIZE = 20

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1)
  const start = (currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE - 1

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  // 🔒 Block non-admin users
  if (profile.role !== 'institution_admin') {
    redirect('/unauthorized') // or redirect to a safe page
  }

  const teachers = await UserService.getByRolePaginated(
    profile.tenant_id,
    'teacher',
    start,
    end
  )

  return (
    <div style={{ maxWidth: '1200px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <PageHeader
        title="Teachers"
        subtitle="Manage your teaching staff"
        actionLabel="+ Add Teacher"
        actionHref="/institution/teachers/new"
      />

      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#6b7280', fontSize: '13px' }}>Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#6b7280', fontSize: '13px' }}>Email</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#6b7280', fontSize: '13px' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#6b7280', fontSize: '13px' }}>Joined</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#6b7280', fontSize: '13px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af' }}>
                  No teachers added yet.{' '}
                  <Link href="/institution/teachers/new" style={{ color: '#6366f1', fontWeight: 500 }}>
                    Add your first teacher →
                  </Link>
                </td>
              </tr>
            ) : (
              teachers.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{t.full_name}</td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>{t.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: t.is_active ? '#dcfce7' : '#f3f4f6',
                        color: t.is_active ? '#166534' : '#6b7280',
                      }}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link
                      href={`/institution/teachers/${t.id}`}
                      style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}
                    >
                      Edit Profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls – unchanged, keep the same as before */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
        {currentPage > 1 && (
          <Link
            href={`/institution/teachers?page=${currentPage - 1}`}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              color: '#374151',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            ← Previous
          </Link>
        )}
        <span style={{ padding: '8px 16px', color: '#6b7280', fontSize: '14px' }}>
          Page {currentPage}
        </span>
        {teachers.length === PAGE_SIZE && (
          <Link
            href={`/institution/teachers?page=${currentPage + 1}`}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              color: '#374151',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  )
}
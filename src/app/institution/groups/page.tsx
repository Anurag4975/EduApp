import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GroupService } from '@/services/group.service'

export default async function GroupsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'institution_admin') redirect('/login')

  const groups = await GroupService.getByTenant(profile.tenant_id)
  const memberCounts = await GroupService.getMemberCounts(profile.tenant_id)

  return (
    <div style={{ maxWidth: '1000px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>Groups</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Organize students into classes and batches
          </p>
        </div>
        <Link
          href="/institution/groups/new"
          style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
        >
          + Create Group
        </Link>
      </div>

      {/* Empty State */}
      {groups.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>No groups yet</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 20px 0' }}>
            Create your first group to organize students into classes or batches
          </p>
          <Link
            href="/institution/groups/new"
            style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
          >
            + Create Group
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {groups.map((group: any) => {
            const count = memberCounts[group.id] ?? 0
            return (
              <Link
                key={group.id}
                href={`/institution/groups/${group.id}`}
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
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {group.name}
                    </h3>
                    {group.academic_session && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                        {group.academic_session}
                      </p>
                    )}
                  </div>
                  <div style={{
                    backgroundColor: '#eef2ff',
                    color: '#6366f1',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}>
                    {count} student{count !== 1 ? 's' : ''}
                  </div>
                </div>

                {group.description && (
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                    {group.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600' }}>
                    View →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
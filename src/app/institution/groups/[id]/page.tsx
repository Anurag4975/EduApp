import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GroupService } from '@/services/group.service'
import { UserService } from '@/services/user.service'
import GroupDetail from './GroupDetail'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'institution_admin') redirect('/login')

  const group = await GroupService.getById(id)
  if (!group) redirect('/institution/groups')

  const [stats, atRiskStudents, { members, total }, allStudents] = await Promise.all([
    GroupService.getGroupStats(id),
    GroupService.getAtRiskStudents(id),
    GroupService.getMembersPaginated(id, 0, 50),
    UserService.getByRole(profile.tenant_id, 'student'),
  ])

  return (
    <GroupDetail
      group={group}
      stats={stats}
      members={members}
      totalMembers={total}
      atRiskStudents={atRiskStudents}
      allStudents={allStudents}
      tenantId={profile.tenant_id}
    />
  )
}
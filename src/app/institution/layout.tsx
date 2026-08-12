import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import NotificationBell from '@/components/ui/NotificationBell'
import CalendarPanel from '@/components/ui/CalendarPanel'
import { EventService } from '@/services/event.service'
import { GroupService } from '@/services/group.service'

export default async function InstitutionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'institution_admin') redirect('/login')

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const { data: recentNotifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const [events, assignmentDueDates, groups, feeDueDates] = await Promise.all([
  profile?.tenant_id ? EventService.getUpcoming(profile.tenant_id, 20) : [],
  profile?.tenant_id ? EventService.getAssignmentDueDates(profile.tenant_id) : [],
  profile?.tenant_id ? GroupService.getByTenant(profile.tenant_id) : [],
  profile?.tenant_id ? EventService.getFeeDueDates(user.id, profile.tenant_id, 'institution_admin') : [],
])

const allEvents = [...events, ...assignmentDueDates, ...feeDueDates].sort(
  (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Sidebar
        sectionLabel="INSTITUTION"
        navItems={[
          { label: 'Dashboard', href: '/institution/dashboard', icon: '▦' },
          { label: 'Teachers', href: '/institution/teachers', icon: '👨‍🏫' },
          { label: 'Students', href: '/institution/students', icon: '🎓' },
          { label: 'Courses', href: '/institution/courses', icon: '📚' },
          { label: 'Groups', href: '/institution/groups', icon: '👥' },
          { label: 'Settings', href: '/institution/settings', icon: '⚙️' },
          { label: 'Calendar', href: '/calendar', icon: '📅' },
          { label: 'Fees', href: '/institution/fees', icon: '💰' },
        ]}
      />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <CalendarPanel
            events={allEvents}
            canCreate={true}
            groups={groups}
          />
          <NotificationBell
            initialCount={unreadCount ?? 0}
            initialNotifications={recentNotifications ?? []}
            userId={user.id}
          />
        </div>
        {children}
      </main>
    </div>
  )
}
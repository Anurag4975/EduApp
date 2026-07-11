import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import NotificationBell from '@/components/ui/NotificationBell'
import CalendarPanel from '@/components/ui/CalendarPanel'
import { EventService } from '@/services/event.service'
import { GroupService } from '@/services/group.service'

export default async function StudentLayout({
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
  if (profile?.role !== 'student') redirect('/login')

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

  const [events, assignmentDueDates] = await Promise.all([
    profile?.tenant_id
      ? EventService.getUpcomingForUser(user.id, profile.tenant_id, 'student', 20)
      : [],
    profile?.tenant_id ? EventService.getAssignmentDueDates(profile.tenant_id) : [],
  ])

  const allEvents = [...events, ...assignmentDueDates].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Sidebar
        sectionLabel="STUDENT"
        navItems={[
          { label: 'Dashboard', href: '/student/dashboard', icon: '▦' },
          { label: 'Browse Courses', href: '/student/courses', icon: '📚' },
          { label: 'Attendance', href: '/student/attendance', icon: '📋' },
          { label: 'My Grades', href: '/student/grades', icon: '📊' },
          { label: 'My Profile', href: '/student/profile', icon: '👤' },
          { label: 'Calendar', href: '/calendar', icon: '📅' },
        ]}
      />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', minWidth: 0, position: 'relative' }}>
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <CalendarPanel
            events={allEvents}
            canCreate={false}
            groups={[]}
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
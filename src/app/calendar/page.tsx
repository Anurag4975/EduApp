import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { EventService } from '@/services/event.service'
import CalendarView from './CalendarView'

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const canCreate = profile.role === 'teacher' || profile.role === 'institution_admin'

  // Get all events for this tenant (full year range)
  const from = new Date()
  from.setMonth(from.getMonth() - 1)
  const to = new Date()
  to.setMonth(to.getMonth() + 12)

  const events = await EventService.getByDateRange(
    profile.tenant_id,
    from.toISOString(),
    to.toISOString()
  )

  const assignmentDueDates = await EventService.getAssignmentDueDates(profile.tenant_id)

  const allEvents = [...events, ...assignmentDueDates].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  )

  return (
    <CalendarView
      events={allEvents}
      canCreate={canCreate}
      userRole={profile.role}
    />
  )
}
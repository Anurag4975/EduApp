import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { EventService } from '@/services/event.service'
import { NotificationService } from '@/services/notification.service'
import { CourseService } from '@/services/course.service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Institution not found' }, { status: 400 })
  }

  const { title, description, type, startDate, endDate } = await request.json()

  if (!title || !startDate) {
    return NextResponse.json({ error: 'Title and start date required' }, { status: 400 })
  }

  const event = await EventService.create({
    tenant_id: profile.tenant_id,
    created_by: user.id,
    title,
    description,
    type,
    start_date: startDate,
    end_date: endDate || undefined,
    visible_to: 'all',
  })

  if (!event) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  // Get all users in this tenant to notify
  const { data: tenantUsers } = await supabase
    .from('users')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .neq('id', user.id)

  if (tenantUsers && tenantUsers.length > 0) {
    await NotificationService.createBulk({
      tenant_id: profile.tenant_id,
      user_ids: tenantUsers.map((u) => u.id),
      title: `New event: ${title}`,
      message: `${profile.full_name} posted a ${type} on ${new Date(startDate).toLocaleDateString()}`,
      type: 'general',
      link: null,
      metadata: { eventId: event.id, eventType: type },
    })
  }

  return NextResponse.json({ success: true, event })
}
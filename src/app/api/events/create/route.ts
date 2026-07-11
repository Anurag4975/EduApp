import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { EventService } from '@/services/event.service'
import { NotificationService } from '@/services/notification.service'

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

  const { title, description, type, startDate, endDate, targetType, targetGroupId } = await request.json()

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
    target_type: targetType ?? 'all',
    target_group_id: targetType === 'group' ? targetGroupId : undefined,
  })

  if (!event) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  // Notify the right users based on target_type
  let userIds: string[] = []

  if (targetType === 'group' && targetGroupId) {
    // Only notify students in that group
    const { data: members } = await supabase
      .from('group_members')
      .select('student_id')
      .eq('group_id', targetGroupId)
    userIds = members?.map((m) => m.student_id) ?? []
  } else if (targetType === 'teachers_only') {
    const { data: teachers } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('role', 'teacher')
    userIds = teachers?.map((t) => t.id) ?? []
  } else if (targetType === 'students_only') {
    const { data: students } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('role', 'student')
    userIds = students?.map((s) => s.id) ?? []
  } else {
    // all — notify everyone except the creator
    const { data: everyone } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .neq('id', user.id)
    userIds = everyone?.map((u) => u.id) ?? []
  }

  if (userIds.length > 0) {
    await NotificationService.createBulk({
      tenant_id: profile.tenant_id,
      user_ids: userIds.filter((id) => id !== user.id),
      title: `New event: ${title}`,
      message: `${profile.full_name} posted a ${type} on ${new Date(startDate).toLocaleDateString()}`,
      type: 'general',
      link: '/calendar',
      metadata: { eventId: event.id, eventType: type },
    })
  }

  return NextResponse.json({ success: true, event })
}
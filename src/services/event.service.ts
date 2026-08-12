import { createServerSupabaseClient } from '@/lib/supabase/server'

export type EventType = 'announcement' | 'exam' | 'class' | 'holiday' | 'other'
export type VisibleTo = 'all' | 'teachers' | 'students'
export type TargetType = 'all' | 'teachers_only' | 'students_only' | 'group'

export const EventService = {

  // Create an event
  async create(data: {
    tenant_id: string
    created_by: string
    course_id?: string
    title: string
    description?: string
    type: EventType
    start_date: string
    end_date?: string
    color?: string
    visible_to?: VisibleTo
    target_type?: TargetType
    target_group_id?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data: event, error } = await supabase
      .from('events')
      .insert(data)
      .select()
      .single()

    if (error) return null
    return event
  },

  // Get all events for a tenant filtered by user role and group membership
  async getForUser(userId: string, tenantId: string, role: string) {
    const supabase = await createServerSupabaseClient()

    // Get groups this user belongs to (if student)
    let userGroupIds: string[] = []
    if (role === 'student') {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('student_id', userId)
      userGroupIds = memberships?.map((m) => m.group_id) ?? []
    }

    const { data, error } = await supabase
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, role), courses(title), groups!events_target_group_id_fkey(name)')
      .eq('tenant_id', tenantId)
      .order('start_date', { ascending: true })

    if (error) return []

    // Filter based on target_type and role
    return (data ?? []).filter((event: any) => {
      const t = event.target_type ?? 'all'
      if (t === 'all') return true
      if (t === 'teachers_only') return role === 'teacher' || role === 'institution_admin'
      if (t === 'students_only') return role === 'student' || role === 'institution_admin'
      if (t === 'group') {
        if (role === 'institution_admin') return true
        if (role === 'teacher') return true // teachers see all group events
        return userGroupIds.includes(event.target_group_id)
      }
      return true
    })
  },

  // Get upcoming events for a user
  async getUpcomingForUser(userId: string, tenantId: string, role: string, limit = 20) {
    const all = await this.getForUser(userId, tenantId, role)
    const today = new Date().toISOString()
    return all
      .filter((e: any) => e.start_date >= today)
      .slice(0, limit)
  },

  // Get all events for a tenant (institution admin — sees everything)
  async getByTenant(tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, role), courses(title), groups!events_target_group_id_fkey(name)')
      .eq('tenant_id', tenantId)
      .order('start_date', { ascending: true })

    if (error) return []
    return data
  },

  // Get upcoming events for a tenant (used in layouts)
  async getUpcoming(tenantId: string, limit = 20) {
    const supabase = await createServerSupabaseClient()
    const today = new Date().toISOString()
    const { data, error } = await supabase
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, role), courses(title), groups!events_target_group_id_fkey(name)')
      .eq('tenant_id', tenantId)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit)

    if (error) return []
    return data
  },

  // Get events for a date range
  async getByDateRange(tenantId: string, from: string, to: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, role), courses(title), groups!events_target_group_id_fkey(name)')
      .eq('tenant_id', tenantId)
      .gte('start_date', from)
      .lte('start_date', to)
      .order('start_date', { ascending: true })

    if (error) return []
    return data
  },

  // Get assignment due dates as events
  async getAssignmentDueDates(tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const today = new Date().toISOString()

    const { data, error } = await supabase
      .from('assignments')
      .select('id, title, due_date, course_id, courses(title)')
      .eq('tenant_id', tenantId)
      .gte('due_date', today)
      .order('due_date', { ascending: true })

    if (error) return []

    return (data ?? []).map((a: any) => ({
      id: `assignment-${a.id}`,
      title: `📝 ${a.title} due`,
      description: `Assignment due in ${a.courses?.title ?? 'a course'}`,
      type: 'assignment_due',
      start_date: a.due_date,
      color: '#f59e0b',
      course_id: a.course_id,
      courses: a.courses,
      target_type: 'all',
      is_assignment: true,
      assignment_id: a.id,
    }))
  },
  // Get fee due dates as events for a specific user
async getFeeDueDates(userId: string, tenantId: string, role: string) {
  const supabase = await createServerSupabaseClient()
  const today = new Date().toISOString()

  if (role === 'student') {
    // Student sees their own pending/overdue fees
    const { data, error } = await supabase
      .from('fee_records')
      .select('id, title, due_date, status')
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("paid","waived")')
      .gte('due_date', today)
      .order('due_date', { ascending: true })

    if (error) return []

    return (data ?? []).map((f: any) => ({
      id: `fee-${f.id}`,
      title: `💰 ${f.title} due`,
      description: `Fee payment due`,
      type: 'fee_due',
      start_date: `${f.due_date}T00:00:00.000Z`,
      color: f.status === 'overdue' ? '#dc2626' : '#8b5cf6',
      target_type: 'students_only',
      is_fee: true,
      fee_record_id: f.id,
    }))
  }

  if (role === 'institution_admin') {
    // Institution sees all upcoming fee due dates
    const { data, error } = await supabase
      .from('fee_records')
      .select('id, title, due_date, status, users!fee_records_student_id_fkey(full_name)')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("paid","waived")')
      .gte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(30)

    if (error) return []

    return (data ?? []).map((f: any) => ({
      id: `fee-${f.id}`,
      title: `💰 ${f.title}`,
      description: `${f.users?.full_name} — fee due`,
      type: 'fee_due',
      start_date: `${f.due_date}T00:00:00.000Z`,
      color: '#8b5cf6',
      target_type: 'all',
      is_fee: true,
      fee_record_id: f.id,
    }))
  }

  return []
},

  // Delete an event
  async delete(eventId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
    return !error
  },

  // Generate Google Calendar URL
  generateGoogleCalendarUrl(event: {
    title: string
    description?: string | null
    start_date: string
    end_date?: string | null
  }) {
    const fmt = (d: string) =>
      new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const start = fmt(event.start_date)
    const end = event.end_date ? fmt(event.end_date) : fmt(event.start_date)
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description ?? '',
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  },
}
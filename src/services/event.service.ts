import { createServerSupabaseClient } from '@/lib/supabase/server'

export type EventType = 'announcement' | 'exam' | 'class' | 'holiday' | 'other'
export type VisibleTo = 'all' | 'teachers' | 'students'

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

  // Get all events for a tenant (with creator info)
  async getByTenant(tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, role), courses(title)')
      .eq('tenant_id', tenantId)
      .order('start_date', { ascending: true })

    if (error) return []
    return data
  },

  // Get upcoming events for a tenant (from today onwards)
  async getUpcoming(tenantId: string, limit = 10) {
    const supabase = await createServerSupabaseClient()
    const today = new Date().toISOString()

    const { data, error } = await supabase
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, role), courses(title)')
      .eq('tenant_id', tenantId)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit)

    if (error) return []
    return data
  },

  // Get events for a specific course
  async getByCourse(courseId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, role)')
      .eq('course_id', courseId)
      .order('start_date', { ascending: true })

    if (error) return []
    return data
  },

  // Get events for a date range (for calendar view)
  async getByDateRange(tenantId: string, from: string, to: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, role), courses(title)')
      .eq('tenant_id', tenantId)
      .gte('start_date', from)
      .lte('start_date', to)
      .order('start_date', { ascending: true })

    if (error) return []
    return data
  },

  // Get assignment due dates as events for a tenant
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

    // Shape them like events for consistent rendering
    return (data ?? []).map((a: any) => ({
      id: `assignment-${a.id}`,
      title: `📝 ${a.title} due`,
      description: `Assignment due in ${a.courses?.title ?? 'a course'}`,
      type: 'assignment_due',
      start_date: a.due_date,
      color: '#f59e0b',
      course_id: a.course_id,
      courses: a.courses,
      is_assignment: true,
      assignment_id: a.id,
    }))
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

  // Generate Google Calendar URL for an event
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
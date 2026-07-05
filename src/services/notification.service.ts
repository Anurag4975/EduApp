import { createServerSupabaseClient } from '@/lib/supabase/server'

export type NotificationType =
  // Assignment
  | 'assignment_submitted'
  | 'assignment_graded'
  // Quiz
  | 'quiz_completed'
  // Content
  | 'lesson_created'
  | 'assignment_created'
  | 'quiz_created'
  // Enrollment
  | 'student_enrolled'
  // General
  | 'general'

export const NotificationService = {

  // Create a single notification
  async create(data: {
    tenant_id: string
    user_id: string
    title: string
    message?: string
    type: NotificationType
    link?: string
    metadata?: Record<string, any>
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('notifications').insert(data)
    return !error
  },

  // Create notifications for multiple users at once (e.g. all enrolled students)
  async createBulk(data: {
    tenant_id: string
    user_ids: string[]
    title: string
    message?: string
    type: NotificationType
    link?: string
    metadata?: Record<string, any>
  }) {
    const supabase = await createServerSupabaseClient()
    const records = data.user_ids.map((user_id) => ({
      tenant_id: data.tenant_id,
      user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      metadata: data.metadata,
    }))
    const { error } = await supabase.from('notifications').insert(records)
    return !error
  },

  // Get all notifications for a user (latest 50)
  async getForUser(userId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return []
    return data
  },

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const supabase = await createServerSupabaseClient()
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return count ?? 0
  },

  // Mark a single notification as read
  async markRead(notificationId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    return !error
  },

  // Mark all notifications as read for a user
  async markAllRead(userId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    return !error
  },

  // Delete a notification
  async delete(notificationId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    return !error
  },
}
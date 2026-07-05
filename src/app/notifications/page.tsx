import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NotificationService } from '@/services/notification.service'
import NotificationsPageClient from './NotificationsPageClient'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const notifications = await NotificationService.getForUser(user.id)
  await NotificationService.markAllRead(user.id)

  return <NotificationsPageClient notifications={notifications} />
}
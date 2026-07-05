'use server'

import { TenantService } from '@/services/tenant.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateGradingScale(scale: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { success: false, error: 'Institution not found.' }

  const success = await TenantService.updateGradingScale(profile.tenant_id, scale)

  if (!success) return { success: false, error: 'Failed to update grading scale.' }

  revalidatePath('/institution/settings')
  return { success: true }
}
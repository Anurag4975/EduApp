'use server'

import { UserService } from '@/services/user.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTeacher(formData: {
  fullName: string
  email: string
}) {
  // Get current logged in institution admin's tenant_id
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { success: false, error: 'Institution not found.' }
  }

  const result = await UserService.invite({
    email: formData.email,
    full_name: formData.fullName,
    role: 'teacher',
    tenant_id: profile.tenant_id,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  revalidatePath('/institution/teachers')
  revalidatePath('/institution/dashboard')

  return { success: true }
}
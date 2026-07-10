import { createServerSupabaseClient } from '@/lib/supabase/server'

export const TeacherProfileService = {

  async getByUserId(userId: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    return data
  },

  async getByTenant(tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('teacher_profiles')
      .select('*, users!teacher_profiles_user_id_fkey(full_name, email)')
      .eq('tenant_id', tenantId)
    return data ?? []
  },

  async upsert(data: {
    user_id: string
    tenant_id: string
    phone?: string
    date_of_birth?: string
    gender?: string
    profile_photo_url?: string
    address_line?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    qualification?: string
    specialization?: string
    experience_years?: number
    employee_id?: string
    joining_date?: string
    emergency_name?: string
    emergency_phone?: string
    emergency_relation?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data: profile, error } = await supabase
      .from('teacher_profiles')
      .upsert(
        { ...data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) return null
    return profile
  },

  getCompletionPercentage(profile: any): number {
    if (!profile) return 0
    const fields = [
      'phone', 'date_of_birth', 'gender',
      'qualification', 'specialization',
      'employee_id', 'joining_date',
      'emergency_name', 'emergency_phone',
    ]
    const filled = fields.filter((f) => profile[f] != null && profile[f] !== '').length
    return Math.round((filled / fields.length) * 100)
  },
}
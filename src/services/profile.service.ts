import { createServerSupabaseClient } from '@/lib/supabase/server'

export const ProfileService = {

  // Get a student's profile
  async getByUserId(userId: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    return data
  },

  // Get all profiles for a tenant (institution view)
  async getByTenant(tenantId: string) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('student_profiles')
      .select('*, users!student_profiles_user_id_fkey(full_name, email)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    return data ?? []
  },

  // Create or update a student profile (upsert)
  async upsert(data: {
    user_id: string
    tenant_id: string
    date_of_birth?: string
    gender?: string
    phone?: string
    profile_photo_url?: string
    address_line?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    guardian_name?: string
    guardian_phone?: string
    guardian_email?: string
    guardian_relation?: string
    emergency_name?: string
    emergency_phone?: string
    emergency_relation?: string
    previous_school?: string
    previous_grade?: string
    admission_date?: string
    student_id_number?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data: profile, error } = await supabase
      .from('student_profiles')
      .upsert(
        { ...data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) return null
    return profile
  },

  // Calculate profile completion percentage
  getCompletionPercentage(profile: any): number {
    if (!profile) return 0
    const fields = [
      'date_of_birth', 'gender', 'phone',
      'address_line', 'city', 'country',
      'guardian_name', 'guardian_phone',
      'emergency_name', 'emergency_phone',
      'admission_date',
    ]
    const filled = fields.filter((f) => profile[f] != null && profile[f] !== '').length
    return Math.round((filled / fields.length) * 100)
  },

  // Get count of students with incomplete profiles
  async getIncompleteProfileCount(tenantId: string): Promise<number> {
    const supabase = await createServerSupabaseClient()

    // Get all students in tenant
    const { data: students } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('role', 'student')

    if (!students || students.length === 0) return 0

    // Get all profiles for tenant
    const { data: profiles } = await supabase
      .from('student_profiles')
      .select('user_id, date_of_birth, gender, phone, address_line, city, country, guardian_name, guardian_phone, emergency_name, emergency_phone, admission_date')
      .eq('tenant_id', tenantId)

    const profileMap: Record<string, any> = {}
    profiles?.forEach((p) => { profileMap[p.user_id] = p })

    // Count students with no profile or incomplete profile
    let incomplete = 0
    students.forEach((s) => {
      const profile = profileMap[s.id]
      if (!profile || this.getCompletionPercentage(profile) < 100) {
        incomplete++
      }
    })

    return incomplete
  },
}
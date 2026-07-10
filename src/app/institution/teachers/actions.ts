'use server'
import { UserService } from '@/services/user.service'
import { TeacherProfileService } from '@/services/teacher.profile.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTeacher(formData: {
  fullName: string
  email: string
  phone?: string
  employeeId?: string
  joiningDate?: string
  qualification?: string
  specialization?: string
  experienceYears?: number
  gender?: string
  dateOfBirth?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { success: false, error: 'Institution not found.' }

  // Create user account
  const result = await UserService.invite({
    email: formData.email,
    full_name: formData.fullName,
    role: 'teacher',
    tenant_id: profile.tenant_id,
  })
  if (!result.success) return { success: false, error: result.error }

  // Get newly created teacher's user ID
  const { data: newTeacher } = await supabase
    .from('users')
    .select('id')
    .eq('email', formData.email)
    .eq('tenant_id', profile.tenant_id)
    .single()

  // Create profile record
  if (newTeacher) {
    await TeacherProfileService.upsert({
      user_id: newTeacher.id,
      tenant_id: profile.tenant_id,
      phone: formData.phone,
      employee_id: formData.employeeId,
      joining_date: formData.joiningDate,
      qualification: formData.qualification,
      specialization: formData.specialization,
      experience_years: formData.experienceYears,
      gender: formData.gender,
      date_of_birth: formData.dateOfBirth,
    })
  }

  revalidatePath('/institution/teachers')
  revalidatePath('/institution/dashboard')
  return { success: true }
}
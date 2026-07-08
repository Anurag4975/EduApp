'use server'
import { UserService } from '@/services/user.service'
import { ProfileService } from '@/services/profile.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStudent(formData: {
  fullName: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  studentIdNumber?: string
  admissionDate?: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  guardianRelation?: string
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

  // Create the user account
  const result = await UserService.invite({
    email: formData.email,
    full_name: formData.fullName,
    role: 'student',
    tenant_id: profile.tenant_id,
  })

  if (!result.success) return { success: false, error: result.error }

  // Get the newly created student's user ID
  const { data: newStudent } = await supabase
    .from('users')
    .select('id')
    .eq('email', formData.email)
    .eq('tenant_id', profile.tenant_id)
    .single()

  // Create their profile record
  if (newStudent) {
    await ProfileService.upsert({
      user_id: newStudent.id,
      tenant_id: profile.tenant_id,
      phone: formData.phone,
      date_of_birth: formData.dateOfBirth,
      gender: formData.gender,
      student_id_number: formData.studentIdNumber,
      admission_date: formData.admissionDate,
      guardian_name: formData.guardianName,
      guardian_phone: formData.guardianPhone,
      guardian_email: formData.guardianEmail,
      guardian_relation: formData.guardianRelation,
    })
  }

  revalidatePath('/institution/students')
  revalidatePath('/institution/dashboard')
  return { success: true }
}
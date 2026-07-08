import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProfileService } from '@/services/profile.service'
import StudentProfileEdit from './StudentProfileEdit'

export default async function InstitutionStudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'institution_admin') redirect('/login')

  // Get the student's account info
  const { data: student } = await supabase
    .from('users')
    .select('id, full_name, email, tenant_id')
    .eq('id', id)
    .eq('tenant_id', adminProfile.tenant_id)
    .single()

  if (!student) redirect('/institution/students')

  const profile = await ProfileService.getByUserId(id)
  const completion = ProfileService.getCompletionPercentage(profile)

  return (
    <StudentProfileEdit
      student={student}
      profile={profile}
      completion={completion}
    />
  )
}
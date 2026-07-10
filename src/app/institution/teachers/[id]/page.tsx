import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TeacherProfileService } from '@/services/teacher.profile.service'
import TeacherProfileEdit from './TeacherProfileEdit'

export default async function InstitutionTeacherProfilePage({
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

  const { data: teacher } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', id)
    .eq('tenant_id', adminProfile.tenant_id)
    .single()
  if (!teacher) redirect('/institution/teachers')

  const profile = await TeacherProfileService.getByUserId(id)
  const completion = TeacherProfileService.getCompletionPercentage(profile)

  return (
    <TeacherProfileEdit
      teacher={teacher}
      profile={profile}
      completion={completion}
    />
  )
}
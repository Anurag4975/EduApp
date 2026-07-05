import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TenantService } from '@/services/tenant.service'
import { AssignmentService } from '@/services/assignment.service'
import AssignmentForm from './AssignmentForm'

export default async function NewAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const gradingScale = await TenantService.getGradingScale(profile.tenant_id)
  const scaleMax = AssignmentService.getScaleMax(gradingScale as any)
  const scaleLabel = AssignmentService.getScaleLabel(gradingScale as any)

  return (
    <AssignmentForm courseId={id} scaleMax={scaleMax} scaleLabel={scaleLabel} />
  )
}
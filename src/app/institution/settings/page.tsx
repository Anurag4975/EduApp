import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TenantService } from '@/services/tenant.service'
import PageHeader from '@/components/ui/PageHeader'
import GradingScaleForm from './GradingScaleForm'

export default async function InstitutionSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const currentScale = await TenantService.getGradingScale(profile.tenant_id)

  return (
    <div style={{ maxWidth: '600px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <PageHeader title="Settings" subtitle="Configure your institution's preferences" />
      <GradingScaleForm currentScale={currentScale} />
    </div>
  )
}
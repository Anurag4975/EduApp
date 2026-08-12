import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TenantService } from '@/services/tenant.service'
import { FeeService } from '@/services/fee.service'
import PageHeader from '@/components/ui/PageHeader'
import GradingScaleForm from './GradingScaleForm'
import FeeSettingsForm from './FeeSettingsForm'

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

  const [currentScale, feeSettings] = await Promise.all([
    TenantService.getGradingScale(profile.tenant_id),
    FeeService.getFeeSettings(profile.tenant_id),
  ])

  return (
    <div style={{ maxWidth: '640px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <PageHeader title="Settings" subtitle="Configure your institution's preferences" />

      {/* Grading Scale */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' }}>
          Grading Scale
        </h2>
        <GradingScaleForm currentScale={currentScale} />
      </div>

      {/* Fee Settings */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' }}>
          Fee Settings
        </h2>
        <FeeSettingsForm
          tenantId={profile.tenant_id}
          settings={feeSettings}
        />
      </div>
    </div>
  )
}
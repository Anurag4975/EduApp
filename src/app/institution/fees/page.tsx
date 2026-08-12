import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FeeService } from '@/services/fee.service'
import FeesOverview from './FeesOverview'

export default async function InstitutionFeesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'institution_admin') redirect('/login')

  const [fees, settings] = await Promise.all([
    FeeService.getTenantFeeOverview(profile.tenant_id),
    FeeService.getFeeSettings(profile.tenant_id),
  ])

  const symbol = settings?.fee_currency_symbol ?? '₹'

  // Summary stats
  const totalOutstanding = fees
    .filter((f: any) => f.status !== 'paid' && f.status !== 'waived')
    .reduce((sum: number, f: any) => sum + Number(f.balance), 0)
  const totalCollected = fees.reduce((sum: number, f: any) => sum + Number(f.amount_paid), 0)
  const overdueCount = fees.filter((f: any) => f.status === 'overdue').length

  return (
    <div style={{ maxWidth: '1100px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>Fees</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Manage student fee records and payments</p>
        </div>
        <Link
          href="/institution/fees/new"
          style={{ padding: '10px 18px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
        >
          + Assign Fee
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Outstanding', value: FeeService.formatAmount(totalOutstanding, symbol), color: '#dc2626', bg: '#fef2f2' },
          { label: 'Total Collected', value: FeeService.formatAmount(totalCollected, symbol), color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Overdue', value: `${overdueCount} records`, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Total Records', value: fees.length, color: '#6366f1', bg: '#eef2ff' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '12px', padding: '16px 20px' }}>
            <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: s.color, margin: '4px 0 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#991b1b' }}>
            🔴 <strong>{overdueCount} fee record{overdueCount > 1 ? 's' : ''}</strong> {overdueCount > 1 ? 'are' : 'is'} overdue
          </span>
        </div>
      )}

      <FeesOverview fees={fees} symbol={symbol} />
    </div>
  )
}
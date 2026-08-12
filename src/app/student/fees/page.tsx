import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FeeService } from '@/services/fee.service'
import StudentFeesClient from './StudentFeesClient'

export default async function StudentFeesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const [fees, payments, settings] = await Promise.all([
    FeeService.getStudentFeeSummary(user.id, profile.tenant_id),
    FeeService.getStudentPayments(user.id),
    FeeService.getFeeSettings(profile.tenant_id),
  ])

  const symbol = settings?.fee_currency_symbol ?? '₹'

  return <StudentFeesClient fees={fees} payments={payments} symbol={symbol} />
}
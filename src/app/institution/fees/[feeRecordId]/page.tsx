import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FeeService } from '@/services/fee.service'
import FeeDetail from './FeeDetail'

export default async function FeeDetailPage({
  params,
}: {
  params: Promise<{ feeRecordId: string }>
}) {
  const { feeRecordId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'institution_admin') redirect('/login')

  // Get the fee record
  const { data: record } = await supabase
    .from('fee_records')
    .select('*, users!fee_records_student_id_fkey(id, full_name, email)')
    .eq('id', feeRecordId)
    .single()

  if (!record) redirect('/institution/fees')

  const [summary, payments, settings] = await Promise.all([
    FeeService.getStudentFeeSummary(record.student_id, profile.tenant_id),
    FeeService.getPayments(feeRecordId),
    FeeService.getFeeSettings(profile.tenant_id),
  ])

  const feeData = summary.find((s: any) => s.fee_record_id === feeRecordId)

  return (
    <FeeDetail
      record={record}
      feeData={feeData}
      payments={payments}
      settings={settings}
      tenantId={profile.tenant_id}
    />
  )
}
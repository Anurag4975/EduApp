import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FeeService } from '@/services/fee.service'
import { NotificationService } from '@/services/notification.service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'institution_admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await request.json()
  const { feeRecordId, studentId, amount, paymentDate, paymentMethod, referenceNumber, notes } = body

  if (!feeRecordId || !studentId || !amount || !paymentDate || !paymentMethod) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await FeeService.recordPayment({
    tenant_id: profile.tenant_id,
    student_id: studentId,
    fee_record_id: feeRecordId,
    amount: Number(amount),
    payment_date: paymentDate,
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    notes,
    recorded_by: user.id,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Notify student
  const settings = await FeeService.getFeeSettings(profile.tenant_id)
  const symbol = settings?.fee_currency_symbol ?? '₹'

  await NotificationService.create({
    tenant_id: profile.tenant_id,
    user_id: studentId,
    title: 'Payment recorded',
    message: `${FeeService.formatAmount(Number(amount), symbol)} received`,
    type: 'general',
    link: '/student/fees',
    metadata: { feeRecordId },
  })

  return NextResponse.json({ success: true })
}
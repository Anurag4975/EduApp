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

  const { paymentId, studentId, reason, feeRecordId } = await request.json()
  if (!paymentId || !reason) {
    return NextResponse.json({ error: 'Payment ID and reason required' }, { status: 400 })
  }

  const success = await FeeService.voidPayment(paymentId, user.id, reason)
  if (!success) return NextResponse.json({ error: 'Failed to void payment' }, { status: 500 })

  // Notify student
  if (studentId) {
    await NotificationService.create({
      tenant_id: profile.tenant_id,
      user_id: studentId,
      title: 'Payment voided',
      message: `A payment was voided. Reason: ${reason}`,
      type: 'general',
      link: '/student/fees',
      metadata: { feeRecordId },
    })
  }

  return NextResponse.json({ success: true })
}
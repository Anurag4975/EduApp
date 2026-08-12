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

  const { feeRecordId, penaltyAmount, studentId } = await request.json()
  if (!feeRecordId || !penaltyAmount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const success = await FeeService.addPenalty(feeRecordId, Number(penaltyAmount))
  if (!success) return NextResponse.json({ error: 'Failed to add penalty' }, { status: 500 })

  // Notify student
  if (studentId) {
    const settings = await FeeService.getFeeSettings(profile.tenant_id)
    const symbol = settings?.fee_currency_symbol ?? '₹'
    await NotificationService.create({
      tenant_id: profile.tenant_id,
      user_id: studentId,
      title: 'Late payment penalty added',
      message: `A penalty of ${FeeService.formatAmount(Number(penaltyAmount), symbol)} has been added to your fee`,
      type: 'general',
      link: '/student/fees',
      metadata: { feeRecordId },
    })
  }

  return NextResponse.json({ success: true })
}
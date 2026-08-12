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
    .select('tenant_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'institution_admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await request.json()
  const { studentId, title, academicSession, baseAmount, discountAmount, dueDate, notes } = body

  if (!studentId || !title || !baseAmount || !dueDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const record = await FeeService.createFeeRecord({
    tenant_id: profile.tenant_id,
    student_id: studentId,
    title,
    academic_session: academicSession,
    base_amount: Number(baseAmount),
    discount_amount: Number(discountAmount ?? 0),
    due_date: dueDate,
    notes,
    created_by: user.id,
  })

  if (!record) return NextResponse.json({ error: 'Failed to create fee record' }, { status: 500 })

  // Notify student
  const settings = await FeeService.getFeeSettings(profile.tenant_id)
  const symbol = settings?.fee_currency_symbol ?? '₹'
  const amount = Number(baseAmount) - Number(discountAmount ?? 0)

  await NotificationService.create({
    tenant_id: profile.tenant_id,
    user_id: studentId,
    title: 'New fee assigned',
    message: `${title} — ${FeeService.formatAmount(amount, symbol)} due by ${new Date(dueDate).toLocaleDateString()}`,
    type: 'general',
    link: '/student/fees',
    metadata: { feeRecordId: record.id },
  })

  return NextResponse.json({ success: true, record })
}
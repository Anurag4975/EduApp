import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FeeService } from '@/services/fee.service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'institution_admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { feeRecordId, ...data } = await request.json()
  if (!feeRecordId) return NextResponse.json({ error: 'Fee record ID required' }, { status: 400 })

  const result = await FeeService.updateFeeRecord(feeRecordId, {
    title: data.title,
    base_amount: data.baseAmount ? Number(data.baseAmount) : undefined,
    discount_amount: data.discountAmount !== undefined ? Number(data.discountAmount) : undefined,
    due_date: data.dueDate,
    notes: data.notes,
    academic_session: data.academicSession,
  })

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
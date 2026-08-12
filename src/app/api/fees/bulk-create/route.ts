import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FeeService } from '@/services/fee.service'
import { NotificationService } from '@/services/notification.service'
import { GroupService } from '@/services/group.service'

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
  const { groupId, title, academicSession, baseAmount, dueDate, notes } = body

  if (!groupId || !title || !baseAmount || !dueDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  
  // Get all students in group
  const { members } = await GroupService.getMembersPaginated(groupId, 0, 1000)
  const studentIds = members.map((m: any) => m.student_id).filter(Boolean)

  if (studentIds.length === 0) {
    return NextResponse.json({ error: 'No students in this group' }, { status: 400 })
  }

  const success = await FeeService.createBulkFeeRecords({
    tenant_id: profile.tenant_id,
    student_ids: studentIds,
    title,
    academic_session: academicSession,
    base_amount: Number(baseAmount),
    due_date: dueDate,
    notes,
    created_by: user.id,
  })

  if (!success) return NextResponse.json({ error: 'Failed to create fee records' }, { status: 500 })

  // Notify all students
  const settings = await FeeService.getFeeSettings(profile.tenant_id)
  const symbol = settings?.fee_currency_symbol ?? '₹'

  await NotificationService.createBulk({
    tenant_id: profile.tenant_id,
    user_ids: studentIds,
    title: 'New fee assigned',
    message: `${title} — ${FeeService.formatAmount(Number(baseAmount), symbol)} due by ${new Date(dueDate).toLocaleDateString()}`,
    type: 'general',
    link: '/student/fees',
  })

  return NextResponse.json({ success: true, count: studentIds.length })
}
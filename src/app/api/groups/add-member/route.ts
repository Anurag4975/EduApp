import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GroupService } from '@/services/group.service'

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

  const { groupId, studentId, tenantId } = await request.json()
  const success = await GroupService.addMember(groupId, studentId, tenantId)

  if (!success) return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  return NextResponse.json({ success: true })
}
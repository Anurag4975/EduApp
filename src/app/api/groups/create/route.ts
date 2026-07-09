import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

  const { name, description, academicSession } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const group = await GroupService.create({
    tenant_id: profile.tenant_id,
    created_by: user.id,
    name,
    description: description || undefined,
    academic_session: academicSession || undefined,
  })

  if (!group) return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  return NextResponse.json({ success: true, groupId: group.id })
}
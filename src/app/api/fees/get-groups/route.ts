import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
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

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, academic_session')
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  return NextResponse.json({ groups: groups ?? [] })
}
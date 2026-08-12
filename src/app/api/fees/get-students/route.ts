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

  const { data: students } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('tenant_id', profile.tenant_id)
    .eq('role', 'student')
    .order('full_name')

  return NextResponse.json({ students: students ?? [] })
}
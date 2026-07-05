import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StorageService } from '@/lib/storage/storage.service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ success: false, error: 'Institution not found.' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'misc'

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 })
  }

  // Basic size limit check (e.g. 100MB)
  const MAX_SIZE = 100 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: 'File too large. Max 100MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = StorageService.generateKey(folder, profile.tenant_id, file.name)

  const result = await StorageService.uploadFile(buffer, key, file.type)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, key: result.key })
}
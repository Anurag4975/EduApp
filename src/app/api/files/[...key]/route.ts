import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StorageService } from '@/lib/storage/storage.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { key } = await params
  const fullKey = key.join('/')

  const url = await StorageService.getSignedUrl(fullKey)

  if (!url) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }

  return NextResponse.redirect(url)
}
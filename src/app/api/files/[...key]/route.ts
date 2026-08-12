import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StorageService } from '@/lib/storage/storage.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { key } = await request.json()
    if (!key) return NextResponse.json({ error: 'No key provided' }, { status: 400 })

    const url = await StorageService.getSignedUrl(key, 900)
    if (!url) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    return NextResponse.json({ url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
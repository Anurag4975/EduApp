import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    const { lessonId, courseId, timestampSeconds, note } = await request.json()

    const { data, error } = await supabase
      .from('video_notes')
      .insert({
        student_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        tenant_id: profile.tenant_id,
        timestamp_seconds: timestampSeconds,
        note,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, note: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
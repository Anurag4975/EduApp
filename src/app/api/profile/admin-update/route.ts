import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!['institution_admin', 'super_admin'].includes(adminProfile?.role ?? '')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()

    const { data: student } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', body.studentId)
      .eq('tenant_id', adminProfile.tenant_id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Use admin client to bypass RLS for this trusted server-side operation
    const supabaseAdmin = createAdminSupabaseClient()

    const { error } = await supabaseAdmin
      .from('student_profiles')
      .upsert({
        user_id: body.studentId,
        tenant_id: adminProfile.tenant_id,
        phone: body.phone || null,
        date_of_birth: body.dateOfBirth || null,
        gender: body.gender || null,
        student_id_number: body.studentIdNumber || null,
        admission_date: body.admissionDate || null,
        address_line: body.addressLine || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || null,
        postal_code: body.postalCode || null,
        guardian_name: body.guardianName || null,
        guardian_phone: body.guardianPhone || null,
        guardian_email: body.guardianEmail || null,
        guardian_relation: body.guardianRelation || null,
        emergency_name: body.emergencyName || null,
        emergency_phone: body.emergencyPhone || null,
        emergency_relation: body.emergencyRelation || null,
        previous_school: body.previousSchool || null,
        previous_grade: body.previousGrade || null,
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('UPSERT ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('ROUTE ERROR:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
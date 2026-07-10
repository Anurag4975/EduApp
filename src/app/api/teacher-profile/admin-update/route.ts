import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TeacherProfileService } from '@/services/teacher.profile.service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'institution_admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await request.json()

  const { data: teacher } = await supabase
    .from('users')
    .select('id')
    .eq('id', body.teacherId)
    .eq('tenant_id', adminProfile.tenant_id)
    .single()

  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const result = await TeacherProfileService.upsert({
    user_id: body.teacherId,
    tenant_id: adminProfile.tenant_id,
    phone: body.phone || undefined,
    date_of_birth: body.dateOfBirth || undefined,
    gender: body.gender || undefined,
    employee_id: body.employeeId || undefined,
    joining_date: body.joiningDate || undefined,
    qualification: body.qualification || undefined,
    specialization: body.specialization || undefined,
    experience_years: body.experienceYears || undefined,
    address_line: body.addressLine || undefined,
    city: body.city || undefined,
    state: body.state || undefined,
    country: body.country || undefined,
    postal_code: body.postalCode || undefined,
    emergency_name: body.emergencyName || undefined,
    emergency_phone: body.emergencyPhone || undefined,
    emergency_relation: body.emergencyRelation || undefined,
  })

  if (!result) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  return NextResponse.json({ success: true })
}
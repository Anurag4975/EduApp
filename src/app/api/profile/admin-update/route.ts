import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// Define validation schema
const StudentProfileSchema = z.object({
  studentId: z.string().uuid(),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  studentIdNumber: z.string().optional().nullable(),
  admissionDate: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.string().email().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  emergencyName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  emergencyRelation: z.string().optional().nullable(),
  previousSchool: z.string().optional().nullable(),
  previousGrade: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Get and validate admin profile
    const { data: adminProfile } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    // ✅ Null check for adminProfile
    if (!adminProfile) {
      return NextResponse.json(
        { error: 'Admin profile not found' },
        { status: 404 }
      )
    }

    // 3. Check authorization
    if (!['institution_admin', 'super_admin'].includes(adminProfile.role ?? '')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validatedBody = StudentProfileSchema.parse(body)

    // 5. Verify student exists and belongs to admin's tenant
    const { data: student } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', validatedBody.studentId)
      .eq('tenant_id', adminProfile.tenant_id)
      .single()

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found in your institution' },
        { status: 404 }
      )
    }

    // 6. Use admin client to bypass RLS for this trusted server-side operation
    const supabaseAdmin = createAdminSupabaseClient()

    const { data: result, error } = await supabaseAdmin
      .from('student_profiles')
      .upsert({
        user_id: validatedBody.studentId,
        tenant_id: adminProfile.tenant_id,
        phone: validatedBody.phone ?? null,
        date_of_birth: validatedBody.dateOfBirth ?? null,
        gender: validatedBody.gender ?? null,
        student_id_number: validatedBody.studentIdNumber ?? null,
        admission_date: validatedBody.admissionDate ?? null,
        address_line: validatedBody.addressLine ?? null,
        city: validatedBody.city ?? null,
        state: validatedBody.state ?? null,
        country: validatedBody.country ?? null,
        postal_code: validatedBody.postalCode ?? null,
        guardian_name: validatedBody.guardianName ?? null,
        guardian_phone: validatedBody.guardianPhone ?? null,
        guardian_email: validatedBody.guardianEmail ?? null,
        guardian_relation: validatedBody.guardianRelation ?? null,
        emergency_name: validatedBody.emergencyName ?? null,
        emergency_phone: validatedBody.emergencyPhone ?? null,
        emergency_relation: validatedBody.emergencyRelation ?? null,
        previous_school: validatedBody.previousSchool ?? null,
        previous_grade: validatedBody.previousGrade ?? null,
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('UPSERT ERROR:', error)
      
      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Student profile already exists' },
          { status: 409 }
        )
      }
      
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Invalid reference to student or tenant' },
          { status: 400 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: result 
    })

  } catch (err: any) {
    // Handle validation errors from Zod
    if (err instanceof z.ZodError) {
      console.error('VALIDATION ERROR:', err.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: err.errors 
        },
        { status: 400 }
      )
    }

    console.error('ROUTE ERROR:', err)
    return NextResponse.json(
      { error: err.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
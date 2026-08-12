import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// Validation schema
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

// Helper function for consistent error responses
function errorResponse(message: string, status: number, details?: any) {
  return NextResponse.json(
    { 
      error: message,
      success: false,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return errorResponse('Not authenticated', 401)
    }

    // 2. Get and validate admin profile
    const { data: adminProfile } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!adminProfile) {
      return errorResponse('Admin profile not found', 404)
    }

    // 3. Check authorization
    if (!['institution_admin', 'super_admin'].includes(adminProfile.role)) {
      return errorResponse('Not authorized', 403)
    }

    // 4. Parse and validate request body
    let body: any
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON in request body', 400)
    }

    const validatedBody = StudentProfileSchema.parse(body)

    // 5. Verify student exists and belongs to admin's tenant
    const { data: student } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', validatedBody.studentId)
      .eq('tenant_id', adminProfile.tenant_id)
      .single()

    if (!student) {
      return errorResponse('Student not found in your institution', 404)
    }

    // 6. Additional role-based checks
    if (adminProfile.role === 'institution_admin') {
      // Institution admins can only manage their own institution's students
      if (student.tenant_id !== adminProfile.tenant_id) {
        return errorResponse('Cannot modify students from other institutions', 403)
      }
    }

    // 7. Audit log
    console.log(
      `[${new Date().toISOString()}] Admin ${user.id} (${adminProfile.role}) updating student ${student.id}`,
      {
        tenant: adminProfile.tenant_id,
        fields: Object.keys(validatedBody).filter(k => k !== 'studentId')
      }
    )

    // 8. Use admin client to bypass RLS for this trusted server-side operation
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
      }, { 
        onConflict: 'user_id' 
      })
      .select()
      .single()

    if (error) {
      console.error('UPSERT ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })

      // Handle specific database errors
      if (error.code === '23505') { // Unique violation
        return errorResponse('Student profile already exists', 409)
      }
      
      if (error.code === '23503') { // Foreign key violation
        return errorResponse('Invalid reference to student or tenant', 400)
      }

      return errorResponse('Failed to update student profile', 500, error.message)
    }

    return NextResponse.json({ 
      success: true,
      data: result 
    })

  } catch (err: any) {
    // Handle validation errors
    if (err instanceof z.ZodError) {
      console.error('VALIDATION ERROR:', err.errors)
      return errorResponse('Validation failed', 400, err.errors)
    }

    // Handle unexpected errors
    console.error('ROUTE ERROR:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      cause: err.cause
    })
    
    return errorResponse(
      process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      500
    )
  }
}
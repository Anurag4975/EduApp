'use server'

import { TenantService } from '@/services/tenant.service'
import { UserService } from '@/services/user.service'
import { revalidatePath } from 'next/cache'

export async function createInstitution(formData: {
  name: string
  slug: string
  adminEmail: string
  adminName: string
  primaryColor: string
}) {
  // Step 1: Create the tenant
  const tenant = await TenantService.create({
    name: formData.name,
    slug: formData.slug,
    primary_color: formData.primaryColor,
  })

  if (!tenant) {
    return { success: false, error: 'Failed to create institution. Slug may already be taken.' }
  }

  // Step 2: Invite the institution admin
  const inviteResult = await UserService.invite({
    email: formData.adminEmail,
    full_name: formData.adminName,
    role: 'institution_admin',
    tenant_id: tenant.id,
  })
  
  console.log('INVITE RESULT:', JSON.stringify(inviteResult))

  if (!inviteResult.success) {
    return { success: false, error: `Institution created but invite failed: ${inviteResult.error}` }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/institutions')

  return { success: true, tenant }
}


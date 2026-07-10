import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TeacherProfileService } from '@/services/teacher.profile.service'

export default async function TeacherProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account } = await supabase
    .from('users')
    .select('full_name, email, tenant_id')
    .eq('id', user.id)
    .single()
  if (!account?.tenant_id) redirect('/login')

  const profile = await TeacherProfileService.getByUserId(user.id)
  const completion = TeacherProfileService.getCompletionPercentage(profile)
  const completionColor = completion >= 80 ? '#16a34a' : completion >= 50 ? '#f59e0b' : '#dc2626'

  const sections = [
    {
      title: 'Personal Information',
      items: [
        { label: 'Full Name', value: account.full_name },
        { label: 'Email', value: account.email },
        { label: 'Phone', value: profile?.phone },
        { label: 'Gender', value: profile?.gender },
        { label: 'Date of Birth', value: profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null },
      ],
    },
    {
      title: 'Professional Information',
      items: [
        { label: 'Employee ID', value: profile?.employee_id },
        { label: 'Qualification', value: profile?.qualification },
        { label: 'Specialization', value: profile?.specialization },
        { label: 'Experience', value: profile?.experience_years != null ? `${profile.experience_years} years` : null },
        { label: 'Joining Date', value: profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString() : null },
      ],
    },
    {
      title: 'Address',
      items: [
        { label: 'Address', value: profile?.address_line },
        { label: 'City', value: profile?.city },
        { label: 'State', value: profile?.state },
        { label: 'Country', value: profile?.country },
        { label: 'Postal Code', value: profile?.postal_code },
      ],
    },
    {
      title: 'Emergency Contact',
      items: [
        { label: 'Name', value: profile?.emergency_name },
        { label: 'Phone', value: profile?.emergency_phone },
        { label: 'Relation', value: profile?.emergency_relation },
      ],
    },
  ]

  return (
    <div style={{ maxWidth: '700px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>My Profile</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Your information on file with the institution</p>
      </div>

      {/* Photo + Name + Completion */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0 }}>
          {profile?.profile_photo_url
            ? <img src={profile.profile_photo_url} alt="Profile" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }} />
            : '👨‍🏫'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>{account.full_name}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 12px 0' }}>{account.email}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Profile completeness</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: completionColor }}>{completion}%</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '999px', height: '6px' }}>
            <div style={{ width: `${completion}%`, backgroundColor: completionColor, borderRadius: '999px', height: '6px' }} />
          </div>
          {completion < 100 && (
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
              Contact your institution to complete your profile
            </p>
          )}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const hasData = section.items.some((i) => i.value)
        return (
          <div key={section.title} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px 0' }}>
              {section.title}
            </p>
            {!hasData ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No information on file</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {section.items.map((item) => (
                  <div key={item.label}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px 0' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '14px', color: item.value ? '#111827' : '#d1d5db', margin: 0 }}>
                      {item.value ?? '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
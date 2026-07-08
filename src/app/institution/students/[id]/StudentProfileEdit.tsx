'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  date_of_birth?: string | null
  gender?: string | null
  phone?: string | null
  profile_photo_url?: string | null
  address_line?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postal_code?: string | null
  guardian_name?: string | null
  guardian_phone?: string | null
  guardian_email?: string | null
  guardian_relation?: string | null
  emergency_name?: string | null
  emergency_phone?: string | null
  emergency_relation?: string | null
  previous_school?: string | null
  previous_grade?: string | null
  admission_date?: string | null
  student_id_number?: string | null
}

export default function StudentProfileEdit({
  student,
  profile,
  completion,
}: {
  student: { id: string; full_name: string; email: string }
  profile: Profile | null
  completion: number
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth ?? '')
  const [gender, setGender] = useState(profile?.gender ?? '')
  const [studentIdNumber, setStudentIdNumber] = useState(profile?.student_id_number ?? '')
  const [admissionDate, setAdmissionDate] = useState(profile?.admission_date ?? '')
  const [addressLine, setAddressLine] = useState(profile?.address_line ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [country, setCountry] = useState(profile?.country ?? '')
  const [postalCode, setPostalCode] = useState(profile?.postal_code ?? '')
  const [guardianName, setGuardianName] = useState(profile?.guardian_name ?? '')
  const [guardianPhone, setGuardianPhone] = useState(profile?.guardian_phone ?? '')
  const [guardianEmail, setGuardianEmail] = useState(profile?.guardian_email ?? '')
  const [guardianRelation, setGuardianRelation] = useState(profile?.guardian_relation ?? '')
  const [emergencyName, setEmergencyName] = useState(profile?.emergency_name ?? '')
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergency_phone ?? '')
  const [emergencyRelation, setEmergencyRelation] = useState(profile?.emergency_relation ?? '')
  const [previousSchool, setPreviousSchool] = useState(profile?.previous_school ?? '')
  const [previousGrade, setPreviousGrade] = useState(profile?.previous_grade ?? '')

  const completionColor = completion >= 80 ? '#16a34a' : completion >= 50 ? '#f59e0b' : '#dc2626'

  async function handleSave() {
    setSaving(true)
    setError('')

    const res = await fetch('/api/profile/admin-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.id,
        phone, dateOfBirth, gender, studentIdNumber, admissionDate,
        addressLine, city, state, country, postalCode,
        guardianName, guardianPhone, guardianEmail, guardianRelation,
        emergencyName, emergencyPhone, emergencyRelation,
        previousSchool, previousGrade,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error ?? 'Failed to save.')
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '700px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/institution/students')}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '12px' }}
        >
          ← Back to students
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          {student.full_name}
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{student.email}</p>
      </div>

      {/* Completion */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Profile completeness</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: completionColor }}>{completion}%</span>
        </div>
        <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '999px', height: '6px' }}>
          <div style={{ width: `${completion}%`, backgroundColor: completionColor, borderRadius: '999px', height: '6px' }} />
        </div>
      </div>

      {/* Personal Info */}
      <Section title="Personal Information">
        <Grid2>
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 234 567 8900" />
          <Field label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
        </Grid2>
        <Grid2>
          <SelectField label="Gender" value={gender} onChange={setGender} options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]} />
          <Field label="Student ID / Roll number" value={studentIdNumber} onChange={setStudentIdNumber} placeholder="STU-2024-001" />
        </Grid2>
        <Grid2>
          <Field label="Admission Date" value={admissionDate} onChange={setAdmissionDate} type="date" />
        </Grid2>
      </Section>

      {/* Address */}
      <Section title="Address">
        <Field label="Address Line" value={addressLine} onChange={setAddressLine} placeholder="123 Main St" />
        <Grid2>
          <Field label="City" value={city} onChange={setCity} placeholder="New York" />
          <Field label="State / Province" value={state} onChange={setState} placeholder="NY" />
        </Grid2>
        <Grid2>
          <Field label="Country" value={country} onChange={setCountry} placeholder="United States" />
          <Field label="Postal Code" value={postalCode} onChange={setPostalCode} placeholder="10001" />
        </Grid2>
      </Section>

      {/* Guardian */}
      <Section title="Guardian Information">
        <Grid2>
          <Field label="Guardian Name" value={guardianName} onChange={setGuardianName} placeholder="John Doe" />
          <SelectField label="Relation" value={guardianRelation} onChange={setGuardianRelation} options={[
            { value: 'father', label: 'Father' },
            { value: 'mother', label: 'Mother' },
            { value: 'guardian', label: 'Guardian' },
            { value: 'other', label: 'Other' },
          ]} />
        </Grid2>
        <Grid2>
          <Field label="Guardian Phone" value={guardianPhone} onChange={setGuardianPhone} placeholder="+1 234 567 8900" />
          <Field label="Guardian Email" value={guardianEmail} onChange={setGuardianEmail} type="email" placeholder="parent@example.com" />
        </Grid2>
      </Section>

      {/* Emergency Contact */}
      <Section title="Emergency Contact">
        <Grid2>
          <Field label="Name" value={emergencyName} onChange={setEmergencyName} placeholder="Jane Doe" />
          <Field label="Relation" value={emergencyRelation} onChange={setEmergencyRelation} placeholder="Aunt" />
        </Grid2>
        <Field label="Phone" value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+1 234 567 8900" />
      </Section>

      {/* Academic Background */}
      <Section title="Academic Background">
        <Grid2>
          <Field label="Previous School" value={previousSchool} onChange={setPreviousSchool} placeholder="Springfield High" />
          <Field label="Previous Grade / Class" value={previousGrade} onChange={setPreviousGrade} placeholder="Grade 10" />
        </Grid2>
      </Section>

      {error && (
        <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#dc2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '11px 28px',
            backgroundColor: saved ? '#16a34a' : '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>{children}</div>
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box' }}
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
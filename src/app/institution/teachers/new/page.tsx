'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addTeacher } from '../actions'

export default function NewTeacherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [qualification, setQualification] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await addTeacher({
      fullName, email, phone, employeeId, joiningDate,
      qualification, specialization,
      experienceYears: experienceYears ? Number(experienceYears) : undefined,
      gender, dateOfBirth,
    })

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/institution/teachers')
      router.refresh()
    }, 1500)
  }

  if (success) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>✓</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Teacher invited!</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>An invite email has been sent to {email}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '12px' }}>
          ← Back
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Add New Teacher</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Fill in the teacher's details and send an invite</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Basic Info */}
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 0 4px 0' }}>
          Basic Information
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Full name *" value={fullName} onChange={setFullName} placeholder="Jane Doe" required />
            <Field label="Email address *" value={email} onChange={setEmail} placeholder="teacher@example.com" type="email" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 234 567 8900" />
            <Field label="Employee ID" value={employeeId} onChange={setEmployeeId} placeholder="EMP-001" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <SelectField label="Gender" value={gender} onChange={setGender} options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
              { value: 'prefer_not_to_say', label: 'Prefer not to say' },
            ]} />
            <Field label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Joining Date" value={joiningDate} onChange={setJoiningDate} type="date" />
          </div>
        </div>

        {/* Professional Info */}
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 0 4px 0' }}>
          Professional Information
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Qualification" value={qualification} onChange={setQualification} placeholder="e.g. M.Sc Physics" />
            <Field label="Specialization" value={specialization} onChange={setSpecialization} placeholder="e.g. Quantum Mechanics" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Years of Experience" value={experienceYears} onChange={setExperienceYears} type="number" placeholder="e.g. 5" />
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '10px 24px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending invite...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value} required={required}
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
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box' }}>
        <option value="">Select...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
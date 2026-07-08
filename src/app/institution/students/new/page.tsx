'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addStudent } from '../actions'

export default function NewStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Basic info
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [studentIdNumber, setStudentIdNumber] = useState('')
  const [admissionDate, setAdmissionDate] = useState('')

  // Guardian
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [guardianRelation, setGuardianRelation] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await addStudent({
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      studentIdNumber,
      admissionDate,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelation,
    })

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/institution/students')
      router.refresh()
    }, 1500)
  }

  if (success) {
    return (
      <div style={styles.root}>
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Student invited!</h2>
          <p style={styles.successText}>An invite email has been sent to {email}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <h1 style={styles.title}>Add New Student</h1>
        <p style={styles.subtitle}>Fill in the student's details and send an invite</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Basic Info */}
        <div style={styles.sectionHeader}>Basic Information</div>
        <div style={styles.section}>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Full name *</label>
              <input required type="text" placeholder="Jane Doe" value={fullName}
                onChange={(e) => setFullName(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email address *</label>
              <input required type="email" placeholder="student@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Phone</label>
              <input type="tel" placeholder="+1 234 567 8900" value={phone}
                onChange={(e) => setPhone(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Date of birth</label>
              <input type="date" value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={styles.input}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Student ID / Roll number</label>
              <input type="text" placeholder="e.g. STU-2024-001" value={studentIdNumber}
                onChange={(e) => setStudentIdNumber(e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Admission date</label>
              <input type="date" value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)} style={styles.input} />
            </div>
          </div>
        </div>

        {/* Guardian Info */}
        <div style={styles.sectionHeader}>Guardian Information</div>
        <div style={styles.section}>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Guardian name</label>
              <input type="text" placeholder="John Doe" value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Relation</label>
              <select value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)} style={styles.input}>
                <option value="">Select relation</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Guardian phone</label>
              <input type="tel" placeholder="+1 234 567 8900" value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Guardian email</label>
              <input type="email" placeholder="parent@example.com" value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)} style={styles.input} />
            </div>
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.actions}>
          <button type="button" onClick={() => router.back()} style={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending invite...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: { maxWidth: '700px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { marginBottom: '28px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', marginTop: '6px' },
  form: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sectionHeader: { fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 0 4px 0' },
  section: { backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '14px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box' as const },
  errorBox: { padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#dc2626' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' },
  cancelBtn: { padding: '11px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  successBox: { textAlign: 'center', padding: '60px 20px' },
  successIcon: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  successTitle: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 },
  successText: { fontSize: '14px', color: '#6b7280', marginTop: '8px' },
}
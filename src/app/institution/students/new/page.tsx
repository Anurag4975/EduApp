'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addStudent } from '../actions'

export default function NewStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await addStudent({ fullName, email })

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
        <p style={styles.subtitle}>Send an invite to a student to join your institution</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <div style={styles.field}>
            <label style={styles.label}>Full name</label>
            <input
              required
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              required
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.actions}>
          <button type="button" onClick={() => router.back()} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
          >
            {loading ? 'Sending invite...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: { maxWidth: '500px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { marginBottom: '32px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', marginTop: '6px' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  section: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  input: { padding: '11px 14px', fontSize: '15px', border: '1.5px solid #e5e7eb', borderRadius: '10px', outline: 'none' },
  errorBox: { padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#dc2626' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelBtn: { padding: '11px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  successBox: { textAlign: 'center', padding: '60px 20px' },
  successIcon: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  successTitle: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 },
  successText: { fontSize: '14px', color: '#6b7280', marginTop: '8px' },
}
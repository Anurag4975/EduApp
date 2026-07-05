'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createInstitution } from '../actions'

export default function NewInstitutionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')

  function handleNameChange(value: string) {
    setName(value)
    setSlug(value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await createInstitution({
      name,
      slug,
      adminEmail,
      adminName,
      primaryColor,
    })

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/admin/institutions')
      router.refresh()
    }, 1500)
  }

  if (success) {
    return (
      <div style={styles.root}>
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Institution created!</h2>
          <p style={styles.successText}>
            An invite email has been sent to {adminEmail}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <h1 style={styles.title}>Add New Institution</h1>
        <p style={styles.subtitle}>Create a new tenant and invite their admin</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Institution Details</h3>

          <div style={styles.field}>
            <label style={styles.label}>Institution name</label>
            <input
              required
              type="text"
              placeholder="ABC College"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subdomain slug</label>
            <div style={styles.slugWrap}>
              <input
                required
                type="text"
                placeholder="abc-college"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={styles.slugInput}
              />
              <span style={styles.slugSuffix}>.eduapp.com</span>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Brand color</label>
            <div style={styles.colorRow}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={styles.colorPicker}
              />
              <span style={styles.colorValue}>{primaryColor}</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Institution Admin</h3>
          <p style={styles.sectionSub}>This person will manage the institution</p>

          <div style={styles.field}>
            <label style={styles.label}>Admin full name</label>
            <input
              required
              type="text"
              placeholder="Jane Smith"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Admin email</label>
            <input
              required
              type="email"
              placeholder="admin@abccollege.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
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
            {loading ? 'Creating...' : 'Create Institution'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: { maxWidth: '600px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { marginBottom: '32px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 },
  subtitle: { fontSize: '15px', color: '#6b7280', marginTop: '6px' },
  form: { display: 'flex', flexDirection: 'column', gap: '32px' },
  section: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 },
  sectionSub: { fontSize: '13px', color: '#9ca3af', margin: '-12px 0 4px 0' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  input: { padding: '11px 14px', fontSize: '15px', border: '1.5px solid #e5e7eb', borderRadius: '10px', outline: 'none' },
  slugWrap: { display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' },
  slugInput: { flex: 1, padding: '11px 14px', fontSize: '15px', border: 'none', outline: 'none' },
  slugSuffix: { padding: '11px 14px', fontSize: '14px', color: '#9ca3af', backgroundColor: '#f9fafb', borderLeft: '1.5px solid #e5e7eb' },
  colorRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  colorPicker: { width: '44px', height: '36px', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', padding: '2px' },
  colorValue: { fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' },
  errorBox: { padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#dc2626' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelBtn: { padding: '11px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  successBox: { textAlign: 'center', padding: '60px 20px' },
  successIcon: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  successTitle: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 },
  successText: { fontSize: '14px', color: '#6b7280', marginTop: '8px' },
}
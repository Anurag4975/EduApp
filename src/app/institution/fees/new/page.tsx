'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewFeePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [students, setStudents] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [studentId, setStudentId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [title, setTitle] = useState('')
  const [academicSession, setAcademicSession] = useState('')
  const [baseAmount, setBaseAmount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')

  const netAmount = Math.max(0, Number(baseAmount || 0) - Number(discountAmount || 0))

  useEffect(() => {
    // Fetch students and groups
    Promise.all([
      fetch('/api/fees/get-students').then(r => r.json()),
      fetch('/api/fees/get-groups').then(r => r.json()),
    ]).then(([s, g]) => {
      setStudents(s.students ?? [])
      setGroups(g.groups ?? [])
    }).catch(() => {})
  }, [])

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const url = mode === 'single' ? '/api/fees/create' : '/api/fees/bulk-create'
    const body = mode === 'single'
      ? { studentId, title, academicSession, baseAmount, discountAmount, dueDate, notes }
      : { groupId, title, academicSession, baseAmount, dueDate, notes }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error ?? 'Failed to assign fee.')
      setLoading(false)
      return
    }

    setSuccess(mode === 'bulk' ? `Fee assigned to ${data.count} students` : 'Fee assigned successfully')
    setLoading(false)
    setTimeout(() => router.push('/institution/fees'), 1500)
  }

  return (
    <div style={{ maxWidth: '600px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '12px' }}>
          ← Back
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Assign Fee</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Assign a fee to a student or an entire group</p>
      </div>

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', color: '#16a34a', fontWeight: '600' }}>
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Mode Toggle */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '10px' }}>Assign to</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['single', 'bulk'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid',
                  borderColor: mode === m ? '#6366f1' : '#e5e7eb',
                  backgroundColor: mode === m ? '#eef2ff' : '#ffffff',
                  color: mode === m ? '#6366f1' : '#6b7280',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                {m === 'single' ? '👤 Single Student' : '👥 Entire Group'}
              </button>
            ))}
          </div>
        </div>

        {/* Student / Group Selector */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'single' ? (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Select Student *</label>
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box', marginBottom: '8px' }}
              />
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #f3f4f6', borderRadius: '8px' }}>
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setStudentId(s.id); setSearch(s.full_name) }}
                    style={{
                      width: '100%', padding: '10px 12px', display: 'flex', flexDirection: 'column',
                      alignItems: 'flex-start', background: studentId === s.id ? '#eef2ff' : 'none',
                      border: 'none', borderBottom: '1px solid #f9fafb', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{s.full_name}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{s.email}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Select Group *</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }}
              >
                <option value="">Select a group...</option>
                {groups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name} {g.academic_session ? `(${g.academic_session})` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Fee Details */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fee Details</label>

          <Field label="Fee Title *" value={title} onChange={setTitle} placeholder="e.g. Tuition Fee Q1, Hostel Fee" required />
          <Field label="Academic Session" value={academicSession} onChange={setAcademicSession} placeholder="e.g. 2024-25" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Base Amount *" value={baseAmount} onChange={setBaseAmount} type="number" placeholder="10000" required />
            <Field label="Discount / Scholarship" value={discountAmount} onChange={setDiscountAmount} type="number" placeholder="0" />
          </div>

          {/* Net amount preview */}
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Net amount student owes</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              {netAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <Field label="Due Date *" value={dueDate} onChange={setDueDate} type="date" required />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Notes</label>
            <textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '10px 24px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Assigning...' : 'Assign Fee'}
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
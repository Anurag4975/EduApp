'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateGradingScale } from './actions'
import Card from '@/components/ui/Card'

export default function GradingScaleForm({ currentScale }: { currentScale: string }) {
  const router = useRouter()
  const [scale, setScale] = useState(currentScale)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const options = [
    { value: 'percentage', label: 'Percentage (0-100)', desc: 'Standard percentage-based grading' },
    { value: 'gpa_4', label: 'GPA — 4.0 Scale', desc: 'Common in US-style colleges' },
    { value: 'gpa_10', label: 'GPA — 10.0 Scale', desc: 'Common in Indian/Nepali universities' },
  ]

  async function handleSave() {
    setLoading(true)
    const result = await updateGradingScale(scale)
    setLoading(false)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
  }

  return (
    <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>Grading Scale</h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
          This applies to all graded assignments across your institution
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {options.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px',
              borderRadius: '10px',
              border: scale === opt.value ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
              backgroundColor: scale === opt.value ? '#eef2ff' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="scale"
              value={opt.value}
              checked={scale === opt.value}
              onChange={() => setScale(opt.value)}
              style={{ marginTop: '3px' }}
            />
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{opt.label}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={loading || scale === currentScale}
        style={{
          padding: '10px 20px',
          backgroundColor: saved ? '#16a34a' : '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          opacity: loading || scale === currentScale ? 0.6 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {saved ? '✓ Saved' : loading ? 'Saving...' : 'Save Changes'}
      </button>
    </Card>
  )
}
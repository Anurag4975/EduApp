'use client'

import { useState } from 'react'

export default function FeeSettingsForm({
  tenantId,
  settings,
}: {
  tenantId: string
  settings: any
}) {
  const [currencySymbol, setCurrencySymbol] = useState(settings?.fee_currency_symbol ?? '₹')
  const [penaltyEnabled, setPenaltyEnabled] = useState(settings?.fee_penalty_enabled ?? false)
  const [penaltyType, setPenaltyType] = useState(settings?.fee_penalty_type ?? 'percentage')
  const [penaltyValue, setPenaltyValue] = useState(String(settings?.fee_penalty_value ?? 0))
  const [gracePeriod, setGracePeriod] = useState(String(settings?.fee_grace_period_days ?? 0))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')

    const res = await fetch('/api/fees/update-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fee_currency_symbol: currencySymbol,
        fee_penalty_enabled: penaltyEnabled,
        fee_penalty_type: penaltyType,
        fee_penalty_value: Number(penaltyValue),
        fee_grace_period_days: Number(gracePeriod),
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
  }

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

      {/* Currency */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Currency Symbol</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['₹', '$', '£', '€', '¥'].map((s) => (
            <button
              key={s}
              onClick={() => setCurrencySymbol(s)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1.5px solid',
                borderColor: currencySymbol === s ? '#6366f1' : '#e5e7eb',
                backgroundColor: currencySymbol === s ? '#eef2ff' : '#ffffff',
                color: currencySymbol === s ? '#6366f1' : '#6b7280',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
          <input
            type="text"
            placeholder="Other"
            value={['₹', '$', '£', '€', '¥'].includes(currencySymbol) ? '' : currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
            maxLength={3}
            style={{ width: '70px', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Penalty Toggle */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0 }}>Late Payment Penalty</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>Charge penalty for overdue fees</p>
          </div>
          <button
            onClick={() => setPenaltyEnabled(!penaltyEnabled)}
            style={{
              width: '44px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              backgroundColor: penaltyEnabled ? '#6366f1' : '#d1d5db',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ffffff',
              position: 'absolute', top: '3px',
              left: penaltyEnabled ? '23px' : '3px',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {penaltyEnabled && (
          <div style={{ marginTop: '12px', padding: '14px', backgroundColor: '#f9fafb', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Penalty Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['percentage', 'flat'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPenaltyType(t)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid',
                      borderColor: penaltyType === t ? '#6366f1' : '#e5e7eb',
                      backgroundColor: penaltyType === t ? '#eef2ff' : '#ffffff',
                      color: penaltyType === t ? '#6366f1' : '#6b7280',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    {t === 'percentage' ? '% Percentage' : '# Flat Amount'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  {penaltyType === 'percentage' ? 'Penalty %' : 'Penalty Amount'}
                </label>
                <input
                  type="number" value={penaltyValue} onChange={(e) => setPenaltyValue(e.target.value)}
                  placeholder={penaltyType === 'percentage' ? '5' : '500'}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Grace Period (days)</label>
                <input
                  type="number" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>Days after due date before penalty applies</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '10px', backgroundColor: saved ? '#16a34a' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', opacity: saving ? 0.7 : 1 }}
      >
        {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Fee Settings'}
      </button>
    </div>
  )
}
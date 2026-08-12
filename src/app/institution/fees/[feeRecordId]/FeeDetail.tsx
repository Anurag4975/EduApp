'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FeeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived'

const statusStyle: Record<string, { bg: string; color: string }> = {
  overdue: { bg: '#fee2e2', color: '#dc2626' },
  partial: { bg: '#fffbeb', color: '#f59e0b' },
  pending: { bg: '#f3f4f6', color: '#6b7280' },
  paid: { bg: '#dcfce7', color: '#16a34a' },
  waived: { bg: '#ede9fe', color: '#8b5cf6' },
}

export default function FeeDetail({
  record,
  feeData,
  payments,
  settings,
  tenantId,
}: {
  record: any
  feeData: any
  payments: any[]
  settings: any
  tenantId: string
}) {
  const router = useRouter()
  const symbol = settings?.fee_currency_symbol ?? '₹'
  const fmt = (n: number) => `${symbol}${Number(n).toLocaleString('en-IN')}`

  const student = record.users
  const status: FeeStatus = feeData?.status ?? 'pending'

  // Payment form state
  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payMethod, setPayMethod] = useState('cash')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  // Penalty form state
  const [showPenalty, setShowPenalty] = useState(false)
  const [penaltyAmount, setPenaltyAmount] = useState('')
  const [addingPenalty, setAddingPenalty] = useState(false)

  // Waive form state
  const [showWaive, setShowWaive] = useState(false)
  const [waiveReason, setWaiveReason] = useState('')
  const [waiving, setWaiving] = useState(false)

  // Void payment state
  const [voidingId, setVoidingId] = useState<string | null>(null)
  const [voidReason, setVoidReason] = useState('')

  async function handleRecordPayment() {
    if (!payAmount || !payDate || !payMethod) return
    setPaying(true)
    setPayError('')

    const res = await fetch('/api/fees/record-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feeRecordId: record.id,
        studentId: student.id,
        amount: payAmount,
        paymentDate: payDate,
        paymentMethod: payMethod,
        referenceNumber: payRef,
        notes: payNotes,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      setPayError(data.error ?? 'Failed to record payment.')
      setPaying(false)
      return
    }

    setPaying(false)
    setShowPayment(false)
    setPayAmount('')
    setPayRef('')
    setPayNotes('')
    router.refresh()
  }

  async function handleAddPenalty() {
    if (!penaltyAmount) return
    setAddingPenalty(true)
    await fetch('/api/fees/add-penalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeRecordId: record.id, penaltyAmount, studentId: student.id }),
    })
    setAddingPenalty(false)
    setShowPenalty(false)
    setPenaltyAmount('')
    router.refresh()
  }

  async function handleWaive() {
    if (!waiveReason) return
    setWaiving(true)
    await fetch('/api/fees/waive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeRecordId: record.id, studentId: student.id, reason: waiveReason }),
    })
    setWaiving(false)
    setShowWaive(false)
    router.refresh()
  }

  async function handleVoidPayment(paymentId: string) {
    if (!voidReason) return
    await fetch('/api/fees/void-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, studentId: student.id, reason: voidReason, feeRecordId: record.id }),
    })
    setVoidingId(null)
    setVoidReason('')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this fee record? This cannot be undone.')) return
    const res = await fetch('/api/fees/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeRecordId: record.id }),
    })
    const data = await res.json()
    if (!data.success) { alert(data.error); return }
    router.push('/institution/fees')
  }

  return (
    <div style={{ maxWidth: '750px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.push('/institution/fees')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '12px' }}>
          ← Back to fees
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>{record.title}</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
              {student.full_name} · {student.email}
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', padding: '5px 14px', borderRadius: '20px', textTransform: 'capitalize', backgroundColor: statusStyle[status]?.bg, color: statusStyle[status]?.color }}>
            {status}
          </span>
        </div>
      </div>

      {/* Fee Summary */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px 0' }}>Fee Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Base Amount', value: fmt(record.base_amount) },
            { label: 'Discount', value: `- ${fmt(record.discount_amount)}`, color: '#16a34a' },
            { label: 'Penalty', value: `+ ${fmt(record.penalty_amount)}`, color: record.penalty_amount > 0 ? '#dc2626' : '#9ca3af' },
            { label: 'Amount Due', value: fmt(feeData?.amount_due ?? 0), bold: true },
            { label: 'Amount Paid', value: fmt(feeData?.amount_paid ?? 0), color: '#16a34a' },
            { label: 'Balance', value: fmt(feeData?.balance ?? 0), color: Number(feeData?.balance) > 0 ? '#dc2626' : '#16a34a', bold: true },
          ].map((item) => (
            <div key={item.label}>
              <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px 0' }}>{item.label}</p>
              <p style={{ fontSize: '16px', fontWeight: item.bold ? '700' : '600', color: item.color ?? '#111827', margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
          <span>Due: {new Date(record.due_date).toLocaleDateString()}</span>
          {record.academic_session && <span>· {record.academic_session}</span>}
          {record.is_locked && <span style={{ color: '#f59e0b' }}>· 🔒 Locked (payments exist)</span>}
        </div>
      </div>

      {/* Actions */}
      {status !== 'waived' && status !== 'paid' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            onClick={() => setShowPayment(!showPayment)}
            style={{ padding: '9px 16px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            + Record Payment
          </button>
          {settings?.fee_penalty_enabled && (
            <button
              onClick={() => setShowPenalty(!showPenalty)}
              style={{ padding: '9px 16px', backgroundColor: '#ffffff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            >
              Add Penalty
            </button>
          )}
          <button
            onClick={() => setShowWaive(!showWaive)}
            style={{ padding: '9px 16px', backgroundColor: '#ffffff', color: '#8b5cf6', border: '1.5px solid #ddd6fe', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            Waive Fee
          </button>
          {!record.is_locked && (
            <button
              onClick={handleDelete}
              style={{ padding: '9px 16px', backgroundColor: '#ffffff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Record Payment Form */}
      {showPayment && (
        <div style={{ backgroundColor: '#eef2ff', borderRadius: '12px', border: '1.5px solid #e0e7ff', padding: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>Record Payment</p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            Balance remaining: <strong>{fmt(feeData?.balance ?? 0)}</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Amount *</label>
              <input type="number" placeholder="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Date *</label>
              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Method *</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Reference No.</label>
              <input type="text" placeholder="Transaction / Cheque no." value={payRef} onChange={(e) => setPayRef(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Notes</label>
            <input type="text" placeholder="Optional notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }} />
          </div>
          {payError && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{payError}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleRecordPayment} disabled={paying}
              style={{ padding: '8px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', opacity: paying ? 0.7 : 1 }}>
              {paying ? 'Saving...' : 'Save Payment'}
            </button>
            <button onClick={() => setShowPayment(false)}
              style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Penalty Form */}
      {showPenalty && (
        <div style={{ backgroundColor: '#fef2f2', borderRadius: '12px', border: '1.5px solid #fecaca', padding: '16px 20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>Add Penalty</p>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Penalty Amount *</label>
            <input type="number" placeholder="0" value={penaltyAmount} onChange={(e) => setPenaltyAmount(e.target.value)}
              style={{ width: '200px', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAddPenalty} disabled={addingPenalty}
              style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              {addingPenalty ? 'Adding...' : 'Add Penalty'}
            </button>
            <button onClick={() => setShowPenalty(false)}
              style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Waive Form */}
      {showWaive && (
        <div style={{ backgroundColor: '#faf5ff', borderRadius: '12px', border: '1.5px solid #ddd6fe', padding: '16px 20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>Waive Fee</p>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Reason *</label>
            <input type="text" placeholder="e.g. Scholarship, Financial hardship" value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleWaive} disabled={waiving}
              style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              {waiving ? 'Waiving...' : 'Confirm Waive'}
            </button>
            <button onClick={() => setShowWaive(false)}
              style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No payments recorded yet.</p>
          </div>
        ) : (
          <div>
            {payments.map((p, i) => (
              <div key={p.id} style={{ padding: '14px 20px', borderBottom: i < payments.length - 1 ? '1px solid #f3f4f6' : 'none', opacity: p.is_voided ? 0.5 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: p.is_voided ? '#9ca3af' : '#16a34a', margin: 0 }}>
                        {p.is_voided ? '✗' : '✓'} {fmt(p.amount)}
                      </p>
                      {p.is_voided && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '600' }}>
                          Voided
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                      {new Date(p.payment_date).toLocaleDateString()} · {p.payment_method.replace('_', ' ')}
                      {p.reference_number && ` · Ref: ${p.reference_number}`}
                    </p>
                    {p.notes && <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>{p.notes}</p>}
                    {p.is_voided && p.voided_reason && (
                      <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0 0' }}>
                        Void reason: {p.voided_reason}
                      </p>
                    )}
                    {p.users && (
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                        Recorded by {p.users.full_name}
                      </p>
                    )}
                  </div>

                  {!p.is_voided && (
                    <div>
                      {voidingId === p.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Void reason *"
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '13px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827' }}
                          />
                          <button onClick={() => handleVoidPayment(p.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            Confirm
                          </button>
                          <button onClick={() => { setVoidingId(null); setVoidReason('') }}
                            style={{ padding: '6px 10px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setVoidingId(p.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                          Void
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
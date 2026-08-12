'use client'

import { useState } from 'react'

type FeeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived'

const statusStyle: Record<string, { bg: string; color: string }> = {
  overdue: { bg: '#fee2e2', color: '#dc2626' },
  partial: { bg: '#fffbeb', color: '#f59e0b' },
  pending: { bg: '#f3f4f6', color: '#6b7280' },
  paid: { bg: '#dcfce7', color: '#16a34a' },
  waived: { bg: '#ede9fe', color: '#8b5cf6' },
}

export default function StudentFeesClient({
  fees,
  payments,
  symbol,
}: {
  fees: any[]
  payments: any[]
  symbol: string
}) {
  const [activeTab, setActiveTab] = useState<'all' | FeeStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fmt = (n: number) => `${symbol}${Number(n).toLocaleString('en-IN')}`

  const filtered = activeTab === 'all' ? fees : fees.filter((f) => f.status === activeTab)

  const totalDue = fees.filter(f => f.status !== 'paid' && f.status !== 'waived')
    .reduce((sum, f) => sum + Number(f.balance), 0)
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.amount_paid), 0)
  const hasOverdue = fees.some(f => f.status === 'overdue')

  const tabs = [
    { key: 'all', label: `All (${fees.length})` },
    { key: 'overdue', label: `Overdue (${fees.filter(f => f.status === 'overdue').length})` },
    { key: 'pending', label: `Pending (${fees.filter(f => f.status === 'pending').length})` },
    { key: 'partial', label: `Partial (${fees.filter(f => f.status === 'partial').length})` },
    { key: 'paid', label: `Paid (${fees.filter(f => f.status === 'paid').length})` },
  ]

  return (
    <div style={{ maxWidth: '750px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>My Fees</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>View your fee records and payment history</p>
      </div>

      {/* Overdue Banner */}
      {hasOverdue && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#991b1b', fontWeight: '600', margin: 0 }}>
            ⚠️ You have overdue fees. Please contact your institution immediately.
          </p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: Number(totalDue) > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '12px', padding: '16px 20px' }}>
          <p style={{ fontSize: '22px', fontWeight: '700', color: Number(totalDue) > 0 ? '#dc2626' : '#16a34a', margin: 0 }}>
            {fmt(totalDue)}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Total Outstanding</p>
        </div>
        <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '16px 20px' }}>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#16a34a', margin: 0 }}>{fmt(totalPaid)}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Total Paid</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f3f4f6', marginBottom: '16px', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab.key ? '#6366f1' : '#6b7280',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              marginBottom: '-1px', whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fee Cards */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No fee records found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((fee) => {
            const isExpanded = expandedId === fee.fee_record_id
            const feePayments = payments.filter((p: any) => p.fee_record_id === fee.fee_record_id)

            return (
              <div
                key={fee.fee_record_id}
                style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: `1px solid ${statusStyle[fee.status as FeeStatus]?.bg ?? '#f3f4f6'}`, overflow: 'hidden' }}
              >
                {/* Fee Header */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>{fee.title}</p>
                      {fee.academic_session && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>{fee.academic_session}</p>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', textTransform: 'capitalize', backgroundColor: statusStyle[fee.status as FeeStatus]?.bg, color: statusStyle[fee.status as FeeStatus]?.color }}>
                      {fee.status}
                    </span>
                  </div>

                  {/* Amount Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Amount Due</p>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>{fmt(fee.amount_due)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Paid</p>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a', margin: 0 }}>{fmt(fee.amount_paid)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Balance</p>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: Number(fee.balance) > 0 ? '#dc2626' : '#16a34a', margin: 0 }}>{fmt(fee.balance)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                      Due: {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                    {feePayments.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : fee.fee_record_id)}
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        {isExpanded ? '▲ Hide history' : `▼ ${feePayments.length} payment${feePayments.length > 1 ? 's' : ''}`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment History */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 20px', backgroundColor: '#f9fafb' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Payment History
                    </p>
                    {feePayments.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6', opacity: p.is_voided ? 0.5 : 1 }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: p.is_voided ? '#9ca3af' : '#16a34a', margin: 0 }}>
                            {p.is_voided ? '✗' : '✓'} {fmt(p.amount)}
                          </p>
                          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                            {new Date(p.payment_date).toLocaleDateString()} · {p.payment_method?.replace('_', ' ')}
                            {p.reference_number && ` · ${p.reference_number}`}
                          </p>
                          {p.is_voided && p.voided_reason && (
                            <p style={{ fontSize: '11px', color: '#dc2626', margin: '2px 0 0 0' }}>Voided: {p.voided_reason}</p>
                          )}
                        </div>
                        {p.is_voided && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '600' }}>
                            Voided
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
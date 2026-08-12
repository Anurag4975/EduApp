'use client'

import { useState } from 'react'
import Link from 'next/link'

type FeeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived'

interface FeeRow {
  fee_record_id: string
  student_id: string
  student_name: string
  student_email: string
  title: string
  academic_session: string | null
  amount_due: number
  amount_paid: number
  balance: number
  due_date: string
  status: FeeStatus
}

const statusStyle: Record<FeeStatus, { bg: string; color: string }> = {
  overdue: { bg: '#fee2e2', color: '#dc2626' },
  partial: { bg: '#fffbeb', color: '#f59e0b' },
  pending: { bg: '#f3f4f6', color: '#6b7280' },
  paid: { bg: '#dcfce7', color: '#16a34a' },
  waived: { bg: '#ede9fe', color: '#8b5cf6' },
}

export default function FeesOverview({ fees, symbol }: { fees: FeeRow[]; symbol: string }) {
  const [activeTab, setActiveTab] = useState<'all' | FeeStatus>('all')
  const [search, setSearch] = useState('')

  const filtered = fees.filter((f) => {
    const matchTab = activeTab === 'all' || f.status === activeTab
    const matchSearch = f.student_name.toLowerCase().includes(search.toLowerCase()) ||
      f.title.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const tabs = [
    { key: 'all', label: `All (${fees.length})` },
    { key: 'overdue', label: `Overdue (${fees.filter(f => f.status === 'overdue').length})` },
    { key: 'partial', label: `Partial (${fees.filter(f => f.status === 'partial').length})` },
    { key: 'pending', label: `Pending (${fees.filter(f => f.status === 'pending').length})` },
    { key: 'paid', label: `Paid (${fees.filter(f => f.status === 'paid').length})` },
    { key: 'waived', label: `Waived (${fees.filter(f => f.status === 'waived').length})` },
  ]

  const fmt = (n: number) => `${symbol}${Number(n).toLocaleString('en-IN')}`

  return (
    <div>
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

      {/* Search */}
      <input
        type="text"
        placeholder="Search by student name or fee title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', boxSizing: 'border-box', marginBottom: '16px' }}
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No fee records found.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Student', 'Fee', 'Amount Due', 'Paid', 'Balance', 'Due Date', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.fee_record_id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{f.student_name}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>{f.student_email}</p>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{f.title}</p>
                    {f.academic_session && (
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>{f.academic_session}</p>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827', fontWeight: '600' }}>
                    {fmt(f.amount_due)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                    {fmt(f.amount_paid)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: Number(f.balance) > 0 ? '#dc2626' : '#16a34a' }}>
                    {fmt(f.balance)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(f.due_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize', backgroundColor: statusStyle[f.status]?.bg, color: statusStyle[f.status]?.color }}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link
                      href={`/institution/fees/${f.fee_record_id}`}
                      style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none', fontWeight: '600', whiteSpace: 'nowrap' }}
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
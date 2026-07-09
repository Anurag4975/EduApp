'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  student_id: string
  full_name: string
  email: string
  added_at: string
}

interface AtRiskStudent {
  student_id: string
  full_name: string
  email: string
  attendance_pct: number
  grade_pct: number
  risk_reasons: string[]
}

interface Student {
  id: string
  full_name: string
  email: string
}

interface Group {
  id: string
  name: string
  description: string | null
  academic_session: string | null
}

interface Stats {
  totalStudents: number
  avgAttendance: number | null
  avgGrade: number | null
}

export default function GroupDetail({
  group,
  stats,
  members,
  totalMembers,
  atRiskStudents,
  allStudents,
  tenantId,
}: {
  group: Group
  stats: Stats
  members: Member[]
  totalMembers: number
  atRiskStudents: AtRiskStudent[]
  allStudents: Student[]
  tenantId: string
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'members' | 'stats' | 'atrisk'>('members')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Students not in group
  const memberIds = new Set(members.map((m) => m.student_id))
  const availableStudents = allStudents.filter(
    (s) => !memberIds.has(s.id) &&
      (s.full_name.toLowerCase().includes(search.toLowerCase()) ||
       s.email.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleAddMember(studentId: string) {
    const res = await fetch('/api/groups/add-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id, studentId, tenantId }),
    })
    if (res.ok) {
      startTransition(() => router.refresh())
    }
  }

  async function handleRemoveMember(studentId: string) {
    if (!confirm('Remove this student from the group?')) return
    const res = await fetch('/api/groups/remove-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id, studentId }),
    })
    if (res.ok) {
      startTransition(() => router.refresh())
    }
  }

  async function handleDeleteGroup() {
    if (!confirm('Delete this group? Students will not be affected.')) return
    const res = await fetch('/api/groups/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id }),
    })
    if (res.ok) router.push('/institution/groups')
  }

  const statColor = (val: number | null, threshold: number) => {
    if (val === null) return '#9ca3af'
    return val >= threshold ? '#16a34a' : val >= threshold * 0.7 ? '#f59e0b' : '#dc2626'
  }

  return (
    <div style={{ maxWidth: '900px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/institution/groups')}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '12px' }}
        >
          ← Back to groups
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{group.name}</h1>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              {group.academic_session && (
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#eef2ff', color: '#6366f1', fontWeight: '600' }}>
                  {group.academic_session}
                </span>
              )}
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {totalMembers} student{totalMembers !== 1 ? 's' : ''}
              </span>
            </div>
            {group.description && (
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '6px 0 0 0' }}>{group.description}</p>
            )}
          </div>
          <button
            onClick={handleDeleteGroup}
            style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            Delete Group
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Students', value: stats.totalStudents, suffix: '', color: '#6366f1', bg: '#eef2ff' },
          { label: 'Avg Attendance', value: stats.avgAttendance, suffix: '%', color: statColor(stats.avgAttendance, 75), bg: '#f9fafb' },
          { label: 'Avg Grade', value: stats.avgGrade, suffix: '%', color: statColor(stats.avgGrade, 50), bg: '#f9fafb' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px 20px' }}>
            <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, margin: 0 }}>
              {s.value != null ? `${s.value}${s.suffix}` : '—'}
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #f3f4f6', marginBottom: '20px' }}>
        {([
          { key: 'members', label: `Members (${totalMembers})` },
          { key: 'stats', label: 'Performance' },
          { key: 'atrisk', label: `At Risk (${atRiskStudents.length})` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab.key ? '#6366f1' : '#6b7280',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.key === 'atrisk' && atRiskStudents.length > 0 && (
              <span style={{ marginLeft: '6px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>
                !
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Add Students */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: adding ? '14px' : 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>Add Students</p>
              <button
                onClick={() => setAdding(!adding)}
                style={{ padding: '7px 14px', backgroundColor: adding ? '#f3f4f6' : '#6366f1', color: adding ? '#374151' : '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                {adding ? 'Close' : '+ Add'}
              </button>
            </div>

            {adding && (
              <div>
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', color: '#111827', width: '100%', boxSizing: 'border-box', marginBottom: '10px' }}
                />
                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {availableStudents.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
                      {search ? 'No students found' : 'All students are already in this group'}
                    </p>
                  ) : (
                    availableStudents.map((s) => (
                      <div
                        key={s.id}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}
                      >
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{s.full_name}</p>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{s.email}</p>
                        </div>
                        <button
                          onClick={() => handleAddMember(s.id)}
                          disabled={isPending}
                          style={{ padding: '6px 12px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current Members */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
            {members.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No students in this group yet.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Added', ''].map((h) => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m.student_id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#111827', fontWeight: 500 }}>{m.full_name}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>{m.email}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#9ca3af' }}>
                        {new Date(m.added_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleRemoveMember(m.student_id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'stats' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Attendance */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Average Attendance</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: statColor(stats.avgAttendance, 75) }}>
                  {stats.avgAttendance != null ? `${stats.avgAttendance}%` : 'No data'}
                </span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '999px', height: '8px' }}>
                <div style={{ width: `${stats.avgAttendance ?? 0}%`, backgroundColor: statColor(stats.avgAttendance, 75), borderRadius: '999px', height: '8px' }} />
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>Target: 75% or above</p>
            </div>

            {/* Grades */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Average Grade</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: statColor(stats.avgGrade, 50) }}>
                  {stats.avgGrade != null ? `${stats.avgGrade}%` : 'No data'}
                </span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '999px', height: '8px' }}>
                <div style={{ width: `${stats.avgGrade ?? 0}%`, backgroundColor: statColor(stats.avgGrade, 50), borderRadius: '999px', height: '8px' }} />
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>Target: 50% or above</p>
            </div>

            {stats.avgAttendance === null && stats.avgGrade === null && (
              <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                No performance data yet. Data appears once students have attendance records and graded assignments.
              </p>
            )}
          </div>
        </div>
      )}

      {/* At Risk Tab */}
      {activeTab === 'atrisk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {atRiskStudents.length === 0 ? (
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#16a34a', margin: 0 }}>
                No at-risk students
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>
                All students meet attendance and grade thresholds
              </p>
            </div>
          ) : (
            atRiskStudents.map((s) => (
              <div
                key={s.student_id}
                style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #fecaca', padding: '16px 20px', borderLeft: '4px solid #dc2626' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{s.full_name}</p>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 8px 0' }}>{s.email}</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {s.risk_reasons.map((reason, i) => (
                        <span key={i} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '600' }}>
                          ⚠️ {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: s.attendance_pct < 75 ? '#dc2626' : '#16a34a', margin: 0 }}>
                        {s.attendance_pct}%
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Attendance</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: s.grade_pct < 50 ? '#dc2626' : '#16a34a', margin: 0 }}>
                        {s.grade_pct}%
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Grade Avg</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
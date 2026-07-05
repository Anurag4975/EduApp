import { TenantService } from "@/services/tenant.service";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import StatsGrid from '@/components/ui/StatsGrid'
export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [stats, institutions] = await Promise.all([
    TenantService.getAdminStats(),
    TenantService.getAll(),
  ])

  const rows = institutions.map((inst) => ({
    institution: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: inst.primary_color, flexShrink: 0 }} />
        <span style={{ fontWeight: 500, color: '#111827' }}>{inst.name}</span>
      </div>
    ),
    slug: <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>{inst.slug}</span>,
    teachers: inst.teacherCount,
    students: inst.studentCount,
    courses: inst.courseCount,
    status: <StatusBadge active={inst.is_active} />,
    actions: (
      <a href={`/admin/institutions/${inst.id}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500, fontSize: '13px' }}>
        View
      </a>
    ),
  }))

  return (
    <div style={{ padding: '20px', maxWidth: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh', boxSizing: 'border-box', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Platform Overview</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Welcome back — here's what's happening across EduApp</p>
        </div>
        <a href="/admin/institutions/new" style={{ padding: '10px 16px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          + Add Institution
        </a>
      </div>

      <StatsGrid>
        <StatCard label="Institutions" value={stats.totalInstitutions} icon="🏫" color="#6366f1" bg="#eef2ff" />
        <StatCard label="Teachers" value={stats.totalTeachers} icon="👨‍🏫" color="#0ea5e9" bg="#f0f9ff" />
        <StatCard label="Students" value={stats.totalStudents} icon="🎓" color="#10b981" bg="#f0fdf4" />
        <StatCard label="Courses" value={stats.totalCourses} icon="📚" color="#f59e0b" bg="#fffbeb" />
      </StatsGrid>

      <DataTable
        title="All Institutions"
        columns={[
          { header: 'Institution', key: 'institution' },
          { header: 'Slug', key: 'slug' },
          { header: 'Teachers', key: 'teachers' },
          { header: 'Students', key: 'students' },
          { header: 'Courses', key: 'courses' },
          { header: 'Status', key: 'status' },
          { header: 'Actions', key: 'actions' },
        ]}
        rows={rows}
        emptyText="No institutions yet."
        emptyLinkText="Add your first institution →"
        emptyLinkHref="/admin/institutions/new"
      />
    </div>
  )
}

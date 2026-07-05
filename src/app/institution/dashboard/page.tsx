import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TenantService } from '@/services/tenant.service';
import type { CSSProperties } from 'react';
import StatCard from '@/components/ui/StatCard'
import StatsGrid from '@/components/ui/StatsGrid'

export default async function InstitutionDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) redirect('/login');

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', profile.tenant_id)
    .single();

  const stats = await TenantService.getInstitutionStats(profile.tenant_id);

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{tenant?.name ?? 'Your Institution'}</h1>
          <p style={styles.subtitle}>Welcome back, {profile.full_name}</p>
        </div>
        <Link href="/institution/teachers/new" style={styles.addBtn}>
          + Add Teacher
        </Link>
      </div>

      <StatsGrid>
  <StatCard label="Teachers" value={stats.totalTeachers} icon="👨‍🏫" color="#0ea5e9" bg="#f0f9ff" />
  <StatCard label="Students" value={stats.totalStudents} icon="🎓" color="#10b981" bg="#f0fdf4" />
  <StatCard label="Courses" value={stats.totalCourses} icon="📚" color="#f59e0b" bg="#fffbeb" />
  <StatCard label="Departments" value={stats.totalDepartments} icon="🏛️" color="#6366f1" bg="#eef2ff" />
</StatsGrid>

      <div style={styles.quickLinks}>
        <Link href="/institution/teachers" style={styles.linkCard}>
          <span style={styles.linkIcon}>👨‍🏫</span>
          <div>
            <p style={styles.linkTitle}>Manage Teachers</p>
            <p style={styles.linkDesc}>Add, view, and manage teaching staff</p>
          </div>
        </Link>
        <Link href="/institution/students" style={styles.linkCard}>
          <span style={styles.linkIcon}>🎓</span>
          <div>
            <p style={styles.linkTitle}>Manage Students</p>
            <p style={styles.linkDesc}>Add, view, and manage enrolled students</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: {
    maxWidth: '1200px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '32px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  addBtn: {
    padding: '10px 18px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #f3f4f6',
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: '22px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '4px 0 0 0',
  },
  quickLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  linkCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    textDecoration: 'none',
    border: '1px solid #f3f4f6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  linkIcon: {
    fontSize: '28px',
  },
  linkTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  linkDesc: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '2px 0 0 0',
  },
};
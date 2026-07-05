import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AttendanceService } from '@/services/attendance.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import CourseCard from './CourseCard'; // new client component

export default async function StudentAttendancePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) redirect('/login');

  const attendance = await AttendanceService.getMyAttendance(
    user.id,
    profile.tenant_id
  );

  // ---------- Overall totals ----------
  const totalPresent = attendance.reduce((s, c) => s + c.present, 0);
  const totalAbsent = attendance.reduce((s, c) => s + c.absent, 0);
  const totalLate = attendance.reduce((s, c) => s + c.late, 0);
  const totalSessions = attendance.reduce((s, c) => s + c.total, 0);
  const overallPercent =
    totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

  return (
    <div
      style={{
        maxWidth: '900px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <PageHeader
        title="My Attendance"
        subtitle="Track your attendance across all courses"
      />

      {/* ----- Overall Summary Card ----- */}
      {attendance.length > 0 && (
        <Card style={{ marginBottom: '24px', padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              📊 Overall Attendance
            </h3>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Stat label="Present" value={totalPresent} color="#16a34a" />
              <Stat label="Absent" value={totalAbsent} color="#dc2626" />
              <Stat label="Late" value={totalLate} color="#f59e0b" />
              <Stat label="Total" value={totalSessions} color="#6b7280" />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor:
                    overallPercent >= 75
                      ? '#dcfce7'
                      : overallPercent >= 50
                      ? '#fffbeb'
                      : '#fee2e2',
                  color:
                    overallPercent >= 75
                      ? '#16a34a'
                      : overallPercent >= 50
                      ? '#f59e0b'
                      : '#dc2626',
                }}
              >
                {overallPercent}%
              </span>
            </div>
          </div>
        </Card>
      )}

      {attendance.length === 0 ? (
        <Card style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            No attendance records yet.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {attendance.map((course: any) => (
            <CourseCard key={course.courseId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tiny helper for the overall stat blocks
function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
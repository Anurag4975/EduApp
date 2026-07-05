'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';

interface CourseAttendance {
  courseId: string;
  courseTitle: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
  records: { id: string; date: string; status: 'present' | 'absent' | 'late' }[];
}

export default function CourseCard({ course }: { course: CourseAttendance }) {
  const [expanded, setExpanded] = useState(false);

  // For the calendar
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Build a map: date string -> status for all records
  const recordMap = new Map<string, string>();
  course.records.forEach((r) => {
    recordMap.set(r.date.split('T')[0], r.status);
  });

  // Calendar helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar cells
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = recordMap.get(dateStr);
    const isToday =
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day;

    let bgColor = 'transparent';
    let textColor = '#374151';
    if (status === 'present') bgColor = '#dcfce7';
    else if (status === 'absent') bgColor = '#fee2e2';
    else if (status === 'late') bgColor = '#fffbeb';

    cells.push(
      <div
        key={day}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: bgColor,
          border: isToday ? '2px solid #3b82f6' : '1px solid #f3f4f6',
          fontSize: '12px',
          fontWeight: status ? 600 : 400,
          color: textColor,
          position: 'relative',
        }}
      >
        {day}
        {status && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor:
                status === 'present'
                  ? '#16a34a'
                  : status === 'absent'
                  ? '#dc2626'
                  : '#f59e0b',
              marginTop: '2px',
            }}
          />
        )}
      </div>
    );
  }

  return (
    <Card style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
            }}
          >
            📚 {course.courseTitle}
          </h3>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
            {course.present}P · {course.absent}A · {course.late}L ·{' '}
            {course.total} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor:
                course.percentage >= 75
                  ? '#dcfce7'
                  : course.percentage >= 50
                  ? '#fffbeb'
                  : '#fee2e2',
              color:
                course.percentage >= 75
                  ? '#16a34a'
                  : course.percentage >= 50
                  ? '#f59e0b'
                  : '#dc2626',
            }}
          >
            {course.percentage}%
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#374151',
            }}
          >
            {expanded ? '▲ Hide' : '📅 Calendar'}
          </button>
        </div>
      </div>

      {/* Progress bar (always visible) */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div
          style={{
            width: '100%',
            backgroundColor: '#f3f4f6',
            borderRadius: '999px',
            height: '6px',
          }}
        >
          <div
            style={{
              width: `${course.percentage}%`,
              backgroundColor:
                course.percentage >= 75
                  ? '#16a34a'
                  : course.percentage >= 50
                  ? '#f59e0b'
                  : '#dc2626',
              borderRadius: '999px',
              height: '6px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        {course.percentage < 75 && (
          <p
            style={{
              fontSize: '11px',
              color: '#dc2626',
              marginTop: '6px',
              fontWeight: 500,
            }}
          >
            ⚠️ Below 75% attendance threshold
          </p>
        )}
      </div>

      {/* Expandable Calendar View */}
      {expanded && (
        <div style={{ padding: '16px 20px' }}>
          {/* Month navigation */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <button
              onClick={prevMonth}
              style={navBtnStyle}
            >
              ◀
            </button>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
              {monthNames[currentMonth]} {currentYear}
            </h4>
            <button
              onClick={nextMonth}
              style={navBtnStyle}
            >
              ▶
            </button>
          </div>

          {/* Day-of-week headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginBottom: '8px',
            }}
          >
            {dayHeaders.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {cells}
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '16px',
              fontSize: '12px',
              color: '#4b5563',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#16a34a' }} /> Present
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#dc2626' }} /> Absent
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Late
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '4px 12px',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#374151',
};
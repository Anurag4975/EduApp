'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addModule,
  addLesson,
  deleteModule,
  deleteLesson,
  publishCourse,
  archiveCourse,
} from '../actions'
import { markAttendance } from '../attendance-actions'
import type { Course, AttendanceStatus } from '@/types'
import FileUploader from '@/components/upload/FileUploader'
import Link from 'next/link'
import { deleteAssignment } from './assignments/actions'
import QuizBuilder from './quizzes/QuizBuilder'

interface Lesson {
  id: string
  title: string
  type: string
  content_url: string | null
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Quiz {
  id: string
  title: string
  description: string | null
  duration_mins: number | null
  total_marks: number
  quiz_questions?: { id: string }[]
}

interface EnrolledStudent {
  id: string
  studentId: string
  fullName: string
  email: string
  enrolledAt: string
  totalLessons: number
}

interface AttendanceHistoryDay {
  date: string
  records: { status: string; users: { full_name: string } }[]
  presentCount: number
  totalCount: number
}

interface Assignment {
  id: string
  title: string
  due_date: string
  submission_type: string
  grading_type: string
  category: string
  max_marks: number | null
}

export default function CourseBuilder({
  course,
  initialModules,
  studentCount,
  enrolledStudents,
  todayAttendance,
  attendanceHistory,
  assignments,
  progressStats,
  quizzes,
}: {
  course: Course
  initialModules: Module[]
  studentCount: number
  enrolledStudents: EnrolledStudent[]
  todayAttendance: { student_id: string; status: string }[]
  attendanceHistory: AttendanceHistoryDay[]
  assignments: Assignment[]
  progressStats: {
    totalStudents: number
    completionsPerLesson: Record<string, number>
  }
  quizzes: Quiz[]
}) {
  const router = useRouter()
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'students' | 'attendance' | 'assignments' | 'quizzes'>('content')
  const [moduleTitle, setModuleTitle] = useState('')
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonType, setLessonType] = useState<'video' | 'document' | 'text'>('text')
  const [lessonUrl, setLessonUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {}
    enrolledStudents.forEach((s) => {
      const existing = todayAttendance.find((a) => a.student_id === s.studentId)
      initial[s.studentId] = (existing?.status as AttendanceStatus) ?? 'present'
    })
    return initial
  })
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [attendanceSaved, setAttendanceSaved] = useState(false)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    published: { bg: '#dcfce7', color: '#16a34a' },
    archived: { bg: '#fee2e2', color: '#dc2626' },
  }

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px',
    fontSize: '14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  async function handleAddModule() {
    if (!moduleTitle.trim()) return
    setLoading(true)
    await addModule(course.id, moduleTitle)
    setModuleTitle('')
    setShowModuleForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleAddLesson(moduleId: string) {
    if (!lessonTitle.trim()) return
    setLoading(true)
    await addLesson(moduleId, course.id, {
      title: lessonTitle,
      type: lessonType,
      content_url: lessonUrl || undefined,
    })
    setLessonTitle('')
    setLessonUrl('')
    setLessonType('text')
    setActiveModuleId(null)
    setLoading(false)
    router.refresh()
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm('Delete this module and all its lessons?')) return
    await deleteModule(moduleId, course.id)
    router.refresh()
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm('Delete this lesson?')) return
    await deleteLesson(lessonId, course.id)
    router.refresh()
  }

  async function handlePublish() {
    await publishCourse(course.id)
    router.refresh()
  }

  async function handleArchive() {
    if (!confirm('Archive this course? Students will no longer see it.')) return
    await archiveCourse(course.id)
    router.refresh()
  }






  async function handleSaveAttendance() {
    setSavingAttendance(true)
    const today = new Date().toISOString().split('T')[0]
    const records = enrolledStudents.map((s) => ({
      studentId: s.studentId,
      status: attendance[s.studentId] ?? 'present',
    }))
    await markAttendance(course.id, today, records)
    setSavingAttendance(false)
    setAttendanceSaved(true)
    setTimeout(() => setAttendanceSaved(false), 2000)
  }

  async function handleDeleteAssignment(assignmentId: string) {
    if (!confirm('Delete this assignment? All submissions will be lost.')) return
    await deleteAssignment(assignmentId, course.id)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '800px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/teacher/courses')}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '16px' }}
        >
          ← Back to courses
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {course.title}
              </h1>
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px',
                backgroundColor: statusColors[course.status].bg, color: statusColors[course.status].color, textTransform: 'capitalize',
              }}>
                {course.status}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{course.description}</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '6px' }}>🎓 {studentCount} students enrolled</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {course.status === 'draft' && (
              <button onClick={handlePublish} style={{ padding: '9px 16px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Publish
              </button>
            )}
            {course.status !== 'archived' && (
              <button onClick={handleArchive} style={{ padding: '9px 16px', backgroundColor: '#ffffff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #f3f4f6', overflowX: 'auto' }}>
        {(['content', 'students', 'attendance', 'assignments', 'quizzes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab ? '#6366f1' : '#6b7280',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '-1px', whiteSpace: 'nowrap',
            }}
          >
            {tab === 'content' ? 'Content'
              : tab === 'students' ? `Students (${enrolledStudents.length})`
              : tab === 'attendance' ? 'Attendance'
              : tab === 'assignments' ? `Assignments (${assignments.length})`
              : `Quizzes (${quizzes.length})`}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {initialModules.map((module, mIndex) => (
            <div key={module.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
                  Module {mIndex + 1}: {module.title}
                </h3>
                <button onClick={() => handleDeleteModule(module.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px' }}>
                  Delete
                </button>
              </div>

              <div style={{ padding: '12px 20px' }}>
                {module.lessons.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9ca3af', padding: '8px 0' }}>No lessons yet.</p>
                ) : (
                  module.lessons.map((lesson, lIndex) => (
                    <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: lIndex < module.lessons.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px' }}>
                          {lesson.type === 'video' ? '🎥' : lesson.type === 'document' ? '📄' : '📝'}
                        </span>
                        <span style={{ fontSize: '14px', color: '#374151' }}>{lesson.title}</span>
                      </div>
                      <button onClick={() => handleDeleteLesson(lesson.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '12px' }}>
                        Remove
                      </button>
                    </div>
                  ))
                )}

                {activeModuleId === module.id ? (
                  <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#eef2ff', borderRadius: '10px', border: '1.5px solid #e0e7ff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Lesson Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Introduction to the topic"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Lesson Type</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['text', 'video', 'document'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setLessonType(type)}
                            style={{
                              flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid',
                              borderColor: lessonType === type ? '#6366f1' : '#e5e7eb',
                              backgroundColor: lessonType === type ? '#6366f1' : '#ffffff',
                              color: lessonType === type ? '#ffffff' : '#6b7280',
                              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                            }}
                          >
                            {type === 'text' ? '📝 Text' : type === 'video' ? '🎥 Video' : '📄 Document'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {lessonType === 'video' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Upload Video</label>
                        <FileUploader folder="videos" accept="video/*" maxSizeMB={500} onUploadComplete={(key) => setLessonUrl(`/api/files/${key}`)} />
                        {lessonUrl && <p style={{ fontSize: '12px', color: '#16a34a', margin: 0 }}>✅ Video ready</p>}
                      </div>
                    )}

                    {lessonType === 'document' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Upload Document</label>
                        <FileUploader folder="documents" accept=".pdf,.doc,.docx,.ppt,.pptx" maxSizeMB={50} onUploadComplete={(key) => setLessonUrl(`/api/files/${key}`)} />
                        {lessonUrl && <p style={{ fontSize: '12px', color: '#16a34a', margin: 0 }}>✅ Document ready</p>}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                      <button onClick={() => handleAddLesson(module.id)} disabled={loading} style={{ padding: '9px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Adding...' : 'Add Lesson'}
                      </button>
                      <button onClick={() => { setActiveModuleId(null); setLessonTitle(''); setLessonUrl(''); setLessonType('text') }} style={{ padding: '9px 18px', backgroundColor: '#ffffff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setActiveModuleId(module.id)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: 0 }}>
                    + Add Lesson
                  </button>
                )}
              </div>
            </div>
          ))}

          {showModuleForm ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Module title (e.g. Introduction)"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddModule} disabled={loading} style={{ padding: '9px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  Add Module
                </button>
                <button onClick={() => setShowModuleForm(false)} style={{ padding: '9px 18px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowModuleForm(true)} style={{ padding: '16px', backgroundColor: '#ffffff', border: '1.5px dashed #d1d5db', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>
              + Add Module
            </button>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          {enrolledStudents.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No students enrolled yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Enrolled On'].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((student, i) => (
                  <tr key={student.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#111827', fontWeight: 500 }}>{student.fullName}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>{student.email}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>{new Date(student.enrolledAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <button onClick={handleSaveAttendance} disabled={savingAttendance} style={{ padding: '8px 16px', backgroundColor: attendanceSaved ? '#16a34a' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                {attendanceSaved ? '✓ Saved' : savingAttendance ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>

            {enrolledStudents.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>No students enrolled yet.</p>
              </div>
            ) : (
              <div>
                {enrolledStudents.map((student, i) => (
                  <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < enrolledStudents.length - 1 ? '1px solid #f3f4f6' : 'none', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>{student.fullName}</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(['present', 'absent', 'late'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setAttendance((prev) => ({ ...prev, [student.studentId]: status }))}
                          style={{
                            padding: '6px 14px', borderRadius: '8px', border: '1.5px solid',
                            borderColor: attendance[student.studentId] === status ? (status === 'present' ? '#16a34a' : status === 'absent' ? '#dc2626' : '#f59e0b') : '#e5e7eb',
                            backgroundColor: attendance[student.studentId] === status ? (status === 'present' ? '#dcfce7' : status === 'absent' ? '#fee2e2' : '#fffbeb') : '#ffffff',
                            color: attendance[student.studentId] === status ? (status === 'present' ? '#16a34a' : status === 'absent' ? '#dc2626' : '#f59e0b') : '#6b7280',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize',
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px', padding: '0 4px' }}>Past Attendance</h3>
            {attendanceHistory.filter((d) => d.date !== new Date().toISOString().split('T')[0]).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', padding: '0 4px' }}>No past records yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attendanceHistory.filter((d) => d.date !== new Date().toISOString().split('T')[0]).map((day) => (
                  <div key={day.date} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                    <button onClick={() => setExpandedDate(expandedDate === day.date ? null : day.date)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {day.presentCount}/{day.totalCount} present {expandedDate === day.date ? '▲' : '▼'}
                      </span>
                    </button>
                    {expandedDate === day.date && (
                      <div style={{ borderTop: '1px solid #f3f4f6', padding: '8px 16px' }}>
                        {day.records.map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < day.records.length - 1 ? '1px solid #f9fafb' : 'none', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '13px', color: '#374151' }}>{r.users?.full_name}</span>
                            <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize', backgroundColor: r.status === 'present' ? '#dcfce7' : r.status === 'absent' ? '#fee2e2' : '#fffbeb', color: r.status === 'present' ? '#16a34a' : r.status === 'absent' ? '#dc2626' : '#f59e0b' }}>
                              {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href={`/teacher/courses/${course.id}/assignments/new`} style={{ padding: '14px', backgroundColor: '#ffffff', border: '1.5px dashed #d1d5db', borderRadius: '12px', textDecoration: 'none', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>
            + Create Assignment
          </Link>
          {assignments.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>No assignments created yet.</p>
          ) : (
            assignments.map((a) => (
              <div key={a.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <Link href={`/teacher/courses/${course.id}/assignments/${a.id}`} style={{ fontSize: '14px', fontWeight: '600', color: '#111827', textDecoration: 'none' }}>
                    {a.title}
                  </Link>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Due {new Date(a.due_date).toLocaleDateString()}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f3f4f6', color: '#6b7280', textTransform: 'capitalize' }}>{a.submission_type}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f3f4f6', color: '#6b7280', textTransform: 'capitalize' }}>{a.category}</span>
                    {a.grading_type === 'graded' && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#eef2ff', color: '#6366f1' }}>/{a.max_marks}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Link href={`/teacher/courses/${course.id}/assignments/${a.id}`} style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                    View submissions
                  </Link>
                  <button onClick={() => handleDeleteAssignment(a.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

     {activeTab === 'quizzes' && (
  <QuizBuilder courseId={course.id} quizzes={quizzes} />
)}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {progressStats.totalStudents === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No students enrolled yet.</p>
            </div>
          ) : (
            initialModules.map((module, mIndex) => (
              <div key={module.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Module {mIndex + 1}: {module.title}
                  </h3>
                </div>
                <div style={{ padding: '8px 20px' }}>
                  {module.lessons.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#9ca3af', padding: '12px 0' }}>No lessons yet.</p>
                  ) : (
                    module.lessons.map((lesson, lIndex) => {
                      const completed = progressStats.completionsPerLesson[lesson.id] ?? 0
                      const total = progressStats.totalStudents
                      const pct = total > 0 ? Math.round((completed / total) * 100) : 0

                      return (
                        <div key={lesson.id} style={{ padding: '14px 0', borderBottom: lIndex < module.lessons.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px' }}>
                                {lesson.type === 'video' ? '🎥' : lesson.type === 'document' ? '📄' : '📝'}
                              </span>
                              <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                                {lesson.title}
                              </span>
                            </div>
                            <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                              {completed}/{total} · {pct}%
                            </span>
                          </div>
                          <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '999px', height: '6px' }}>
                            <div style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : '#6366f1', borderRadius: '999px', height: '6px', transition: 'width 0.3s ease' }} />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
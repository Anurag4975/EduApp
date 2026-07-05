'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { createCourse } from '../actions'

interface Teacher {
  id: string
  full_name: string
}

export default function NewCoursePage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(true)

  useEffect(() => {
    async function loadTeachers() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) return

      const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('tenant_id', profile.tenant_id)
        .eq('role', 'teacher')

      setTeachers(data ?? [])
      setLoadingTeachers(false)
    }

    loadTeachers()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!teacherId) {
      setError('Please select a teacher.')
      return
    }

    setLoading(true)
    const result = await createCourse({ title, description, teacherId })

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    router.push('/institution/courses')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>Create New Course</h1>
        <p style={{ fontSize: '15px', color: '#6b7280', marginTop: '6px' }}>Set up the course and assign a teacher</p>
      </div>

      {loadingTeachers ? (
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading teachers...</p>
      ) : teachers.length === 0 ? (
        <div style={{ padding: '20px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', fontSize: '14px', color: '#92400e' }}>
          You need to add at least one teacher before creating a course.{' '}
          <a href="/institution/teachers/new" style={{ color: '#6366f1', fontWeight: 500 }}>
            Add a teacher →
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Course title</label>
              <input
                required
                type="text"
                placeholder="Introduction to Web Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ padding: '11px 14px', fontSize: '15px', border: '1.5px solid #e5e7eb', borderRadius: '10px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Description</label>
              <textarea
                required
                rows={4}
                placeholder="What will students learn in this course?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ padding: '11px 14px', fontSize: '15px', border: '1.5px solid #e5e7eb', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Assign teacher</label>
              <select
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                style={{ padding: '11px 14px', fontSize: '15px', border: '1.5px solid #e5e7eb', borderRadius: '10px', outline: 'none' }}
              >
                <option value="">Select a teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ padding: '11px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '11px 24px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
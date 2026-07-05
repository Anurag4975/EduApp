'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { enrollInCourse } from './actions'

export default function EnrollButton({
  courseId,
  isEnrolled,
}: {
  courseId: string
  isEnrolled: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)

  async function handleEnroll() {
    setLoading(true)
    const result = await enrollInCourse(courseId)
    if (result.success) {
      setEnrolled(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (enrolled) {
    return (
      <button
        onClick={() => router.push(`/student/courses/${courseId}`)}
        style={{
          marginTop: '8px',
          padding: '9px 16px',
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
          border: '1.5px solid #bbf7d0',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
        }}
      >
        ✓ Enrolled — Continue
      </button>
    )
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      style={{
        marginTop: '8px',
        padding: '9px 16px',
        backgroundColor: '#6366f1',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? 'Enrolling...' : 'Enroll Now'}
    </button>
  )
}
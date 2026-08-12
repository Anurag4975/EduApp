'use client'

import { useState, useEffect } from 'react'

export default function SecurePDFViewer({
  contentUrl,
  title,
}: {
  contentUrl: string
  title: string
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function resolveUrl() {
      try {
        // Extract the B2 key from the content_url
        // content_url looks like: /api/files/documents/tenant-id/filename.pdf
        const key = contentUrl.replace('/api/files/', '')

        const res = await fetch('/api/files/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })

        const data = await res.json()

        if (!res.ok || !data.url) {
          setError(data.error ?? 'Failed to load document.')
          setLoading(false)
          return
        }

        setSignedUrl(data.url)
      } catch (err: any) {
        setError(err.message ?? 'Failed to load document.')
      } finally {
        setLoading(false)
      }
    }

    if (contentUrl) resolveUrl()
  }, [contentUrl])

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '500px',
        backgroundColor: '#f9fafb',
        borderRadius: '10px',
        border: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: '#9ca3af',
      }}>
        Loading document...
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fef2f2',
        borderRadius: '10px',
        border: '1px solid #fecaca',
        fontSize: '14px',
        color: '#dc2626',
        textAlign: 'center',
      }}>
        {error || 'Failed to load document.'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <iframe
        src={signedUrl}
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #f3f4f6',
          borderRadius: '10px',
          backgroundColor: '#f9fafb',
        }}
        title={title}
      />
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '12px',
          color: '#6366f1',
          textDecoration: 'none',
          fontWeight: 500,
          alignSelf: 'flex-end',
        }}
      >
        📄 Open fullscreen →
      </a>
    </div>
  )
}
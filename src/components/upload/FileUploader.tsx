'use client'

import { useState, useRef } from 'react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface FileUploaderProps {
  folder?: string
  accept?: string
  maxSizeMB?: number
  onUploadComplete?: (key: string) => void
  label?: string
}

export default function FileUploader({
  folder = 'misc',
  accept = 'video/*',
  maxSizeMB = 100,
  onUploadComplete,
  label = 'Upload File',
}: FileUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedKey, setUploadedKey] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setStatus('uploading')
    setProgress(0)

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`)
      setStatus('error')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    // XHR so we get real upload progress
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      const res = JSON.parse(xhr.responseText)
      if (xhr.status === 200 && res.success) {
        setStatus('success')
        setUploadedKey(res.key)
        onUploadComplete?.(res.key)
      } else {
        setError(res.error || 'Upload failed.')
        setStatus('error')
      }
    })

    xhr.addEventListener('error', () => {
      setError('Network error. Please try again.')
      setStatus('error')
    })

    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const reset = () => {
    setStatus('idle')
    setProgress(0)
    setError(null)
    setUploadedKey(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="w-full">
      {status === 'idle' || status === 'error' ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleChange}
          />
          <p className="text-gray-500 text-sm">
            Drag & drop or <span className="text-blue-600 font-medium">browse</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {accept.replace('/*', ' files')} · Max {maxSizeMB}MB
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-3">{error}</p>
          )}
        </div>
      ) : status === 'uploading' ? (
        <div className="border rounded-xl p-6 space-y-3">
          <p className="text-sm text-gray-600 font-medium">Uploading... {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="border border-green-200 bg-green-50 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-green-700 font-medium text-sm">✅ Upload complete</p>
            <p className="text-green-600 text-xs mt-1 break-all">{uploadedKey}</p>
          </div>
          <button
            onClick={reset}
            className="text-xs text-gray-500 underline ml-4 shrink-0"
          >
            Replace
          </button>
        </div>
      )}
    </div>
  )
}
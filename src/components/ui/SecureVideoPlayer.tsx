'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Note {
  id: string
  timestamp_seconds: number
  note: string
  created_at: string
}

interface SecureVideoPlayerProps {
  src: string
  lessonId: string
  courseId: string
  studentEmail: string
  studentName: string
  completedLessonIds: string[]
  onComplete?: () => void
  savedProgress?: number
}

export default function SecureVideoPlayer({
  src,
  lessonId,
  courseId,
  studentEmail,
  studentName,
  completedLessonIds,
  onComplete,
  savedProgress = 0,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const watermarkRef = useRef<HTMLDivElement>(null)
  const watchedRef = useRef<Set<number>>(new Set())
  const noteInputRef = useRef<HTMLInputElement>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [grayscale, setGrayscale] = useState(false)
  const [completed, setCompleted] = useState(completedLessonIds.includes(lessonId))
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [watermarkPos, setWatermarkPos] = useState({ top: '15%', left: '10%' })

  // ✅ FIXED: Added null as initial value and null to type
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const watermarkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load notes
  useEffect(() => {
    fetch(`/api/notes/${lessonId}`)
      .then(r => r.json())
      .then(d => setNotes(d.notes ?? []))
  }, [lessonId])

  // Resume from saved progress
  useEffect(() => {
    if (videoRef.current && savedProgress > 0) {
      videoRef.current.currentTime = savedProgress
    }
  }, [savedProgress])

  // Moving watermark — never in center
  useEffect(() => {
    const positions = [
      { top: '10%', left: '5%' },
      { top: '10%', left: '65%' },
      { top: '75%', left: '5%' },
      { top: '75%', left: '65%' },
      { top: '40%', left: '5%' },
      { top: '40%', left: '65%' },
      { top: '10%', left: '35%' },
      { top: '75%', left: '35%' },
    ]
    let index = 0

    watermarkIntervalRef.current = setInterval(() => {
      index = (index + 1) % positions.length
      setWatermarkPos(positions[index])
    }, 8000)

    // ✅ FIXED: Added null check
    return () => {
      if (watermarkIntervalRef.current) clearInterval(watermarkIntervalRef.current)
    }
  }, [])

  // Auto-pause on tab switch
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
        setPlaying(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Disable right-click and keyboard shortcuts
 // Disable right-click and keyboard shortcuts
useEffect(() => {
  function handleContextMenu(e: MouseEvent) {
    if (containerRef.current?.contains(e.target as Node)) {
      e.preventDefault()
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== document.body) return

    const blocked = [
      e.ctrlKey && e.key === 's',       // Ctrl+S (Save)
      e.ctrlKey && e.key === 'u',       // Ctrl+U (View Source)
      e.ctrlKey && e.shiftKey && e.key === 'I',  // Ctrl+Shift+I (DevTools)
      e.key === 'PrintScreen',           // Print Screen
    ]
    if (blocked.some(Boolean)) e.preventDefault()
  }

  document.addEventListener('contextmenu', handleContextMenu)
  document.addEventListener('keydown', handleKeyDown)
  return () => {
    document.removeEventListener('contextmenu', handleContextMenu)
    document.removeEventListener('keydown', handleKeyDown)
  }
}, [])

  // Auto-hide controls
  function resetControlsTimeout() {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  // Track watched seconds for 80% completion
  function handleTimeUpdate() {
    const video = videoRef.current
    if (!video) return

    setCurrentTime(video.currentTime)
    watchedRef.current.add(Math.floor(video.currentTime))

    // Update buffered
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1))
    }

    // Check 80% completion
    if (!completed && video.duration > 0) {
      const watchedPercent = (watchedRef.current.size / video.duration) * 100
      if (watchedPercent >= 80) {
        setCompleted(true)
        onComplete?.()
      }
    }
  }

  function handleLoadedMetadata() {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
      setGrayscale(false)
    } else {
      video.pause()
      setPlaying(false)
      setGrayscale(true)
    }
  }

  function handlePause() {
    setPlaying(false)
    setGrayscale(true)
  }

  function handlePlay() {
    setPlaying(true)
    setGrayscale(false)
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const newTime = ratio * duration
    if (videoRef.current) videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  function changeSpeed(s: number) {
    setSpeed(s)
    if (videoRef.current) videoRef.current.playbackRate = s
    setShowSpeedMenu(false)
  }

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !muted
      setMuted(!muted)
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    setVolume(v)
    if (videoRef.current) {
      videoRef.current.volume = v
      setMuted(v === 0)
    }
  }

  function toggleFullscreen() {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function jumpToNote(seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds
      setCurrentTime(seconds)
    }
  }

  async function saveNote() {
    if (!newNote.trim()) return
    setSavingNote(true)

    const res = await fetch('/api/notes/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId,
        courseId,
        timestampSeconds: Math.floor(currentTime),
        note: newNote.trim(),
      }),
    })

    const data = await res.json()
    if (data.success) {
      setNotes(prev => [...prev, data.note].sort(
        (a, b) => a.timestamp_seconds - b.timestamp_seconds
      ))
      setNewNote('')
    }
    setSavingNote(false)
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/notes/${lessonId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', userSelect: 'none' }}>

      {/* Video Container */}
      <div
        ref={containerRef}
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => playing && setShowControls(false)}
        style={{
          position: 'relative',
          backgroundColor: '#000000',
          borderRadius: '12px',
          overflow: 'hidden',
          aspectRatio: '16/9',
          cursor: showControls ? 'default' : 'none',
        }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={() => { setPlaying(false); setGrayscale(true) }}
          onClick={togglePlay}
          controlsList="nodownload nofullscreen"
          disablePictureInPicture
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: grayscale ? 'grayscale(100%)' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />

        {/* Moving Watermark */}
        <div
          ref={watermarkRef}
          style={{
            position: 'absolute',
            top: watermarkPos.top,
            left: watermarkPos.left,
            color: 'rgba(255,255,255,0.35)',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            transition: 'top 1s ease, left 1s ease',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {studentEmail}
        </div>

        {/* Play/Pause Overlay */}
        {!playing && (
          <div
            onClick={togglePlay}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99,102,241,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              ▶
            </div>
          </div>
        )}

        {/* Completed Badge */}
        {completed && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: '#16a34a',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            zIndex: 10,
          }}>
            ✓ Completed
          </div>
        )}

        {/* Controls */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          padding: '20px 16px 12px',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          zIndex: 10,
        }}>

          {/* Progress Bar */}
          <div
            onClick={handleProgressClick}
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '999px',
              cursor: 'pointer',
              position: 'relative',
              marginBottom: '10px',
            }}
          >
            {/* Buffered */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${bufferedPercent}%`,
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: '999px',
            }} />
            {/* Played */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: '#6366f1',
              borderRadius: '999px',
            }} />
            {/* Thumb */}
            <div style={{
              position: 'absolute',
              left: `${progressPercent}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
            }} />
          </div>

          {/* Bottom Controls Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}>

            {/* Left Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                style={btnStyle}
              >
                {playing ? '⏸' : '▶'}
              </button>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={toggleMute} style={btnStyle}>
                  {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{ width: '60px', cursor: 'pointer', accentColor: '#6366f1' }}
                />
              </div>

              {/* Time */}
              <span style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'monospace' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
              {/* Speed */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSpeedMenu(v => !v)}
                  style={{ ...btnStyle, fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px' }}
                >
                  {speed}x
                </button>
                {showSpeedMenu && (
                  <div style={{
                    position: 'absolute',
                    bottom: '32px',
                    right: 0,
                    backgroundColor: '#1f2937',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    zIndex: 20,
                    minWidth: '80px',
                  }}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                      <button
                        key={s}
                        onClick={() => changeSpeed(s)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '8px 16px',
                          background: speed === s ? '#6366f1' : 'none',
                          border: 'none',
                          color: '#fff',
                          fontSize: '13px',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes toggle */}
              <button
                onClick={() => setShowNotes(v => !v)}
                style={{ ...btnStyle, fontSize: '16px' }}
                title="Notes"
              >
                📝
              </button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} style={btnStyle}>
                {fullscreen ? '⛶' : '⛶'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #f3f4f6',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
              📝 My Notes
            </h3>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Add Note */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                At {formatTime(currentTime)}
              </span>
              <input
                ref={noteInputRef}
                type="text"
                placeholder="Add a note at current timestamp..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNote()}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={saveNote}
              disabled={savingNote || !newNote.trim()}
              style={{
                padding: '8px 14px',
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                alignSelf: 'flex-end',
                opacity: savingNote || !newNote.trim() ? 0.6 : 1,
              }}
            >
              Save
            </button>
          </div>

          {/* Notes List */}
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {notes.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', padding: '20px 16px', margin: 0, textAlign: 'center' }}>
                No notes yet. Add your first note above.
              </p>
            ) : (
              notes.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f9fafb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <button
                      onClick={() => jumpToNote(n.timestamp_seconds)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6366f1',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: '4px',
                        fontFamily: 'monospace',
                      }}
                    >
                      ▶ {formatTime(n.timestamp_seconds)}
                    </button>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{n.note}</p>
                  </div>
                  <button
                    onClick={() => deleteNote(n.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '16px',
                      flexShrink: 0,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: '18px',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
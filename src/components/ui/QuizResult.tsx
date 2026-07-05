interface QuizResultProps {
  score: number
  totalMarks: number
  correctCount: number
  totalQuestions: number
  timeTaken?: string
}

export default function QuizResult({
  score,
  totalMarks,
  correctCount,
  totalQuestions,
  timeTaken,
}: QuizResultProps) {
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
  const passed = percentage >= 50

  return (
    <div style={styles.card}>
      <div style={{ ...styles.scoreBadge, backgroundColor: passed ? '#dcfce7' : '#fee2e2' }}>
        <p style={{ ...styles.scoreValue, color: passed ? '#16a34a' : '#dc2626' }}>
          {score}/{totalMarks}
        </p>
        <p style={{ ...styles.scoreLabel, color: passed ? '#16a34a' : '#dc2626' }}>
          {percentage}% — {passed ? 'Passed 🎉' : 'Failed'}
        </p>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={{ ...styles.statVal, color: '#16a34a' }}>{correctCount}</span>
          <span style={styles.statLabel}>Correct</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statVal, color: '#dc2626' }}>{totalQuestions - correctCount}</span>
          <span style={styles.statLabel}>Wrong</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statVal, color: '#6366f1' }}>{totalQuestions}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        {timeTaken && (
          <div style={styles.stat}>
            <span style={{ ...styles.statVal, color: '#f59e0b' }}>{timeTaken}</span>
            <span style={styles.statLabel}>Time</span>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #f3f4f6',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center',
    textAlign: 'center',
  },
  scoreBadge: {
    borderRadius: '12px',
    padding: '20px 40px',
    width: '100%',
  },
  scoreValue: {
    fontSize: '36px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-1px',
  },
  scoreLabel: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '4px 0 0 0',
  },
  stats: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statVal: {
    fontSize: '24px',
    fontWeight: '700',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
}
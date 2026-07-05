interface QuizCardProps {
  title: string
  description?: string | null
  totalMarks: number
  durationMins?: number | null
  questionCount: number
  action?: React.ReactNode
}

export default function QuizCard({
  title,
  description,
  totalMarks,
  durationMins,
  questionCount,
  action,
}: QuizCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.left}>
        <div style={styles.icon}>📝</div>
        <div>
          <p style={styles.title}>{title}</p>
          {description && <p style={styles.desc}>{description}</p>}
          <div style={styles.meta}>
            <span style={styles.badge}>{questionCount} questions</span>
            <span style={styles.badge}>{totalMarks} marks</span>
            {durationMins && <span style={styles.badge}>{durationMins} mins</span>}
          </div>
        </div>
      </div>
      {action && <div style={styles.action}>{action}</div>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #f3f4f6',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  left: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
    minWidth: '200px',
  },
  icon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  desc: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  meta: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '20px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    fontWeight: '500',
  },
  action: {
    flexShrink: 0,
  },
}
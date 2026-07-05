interface Option {
  key: 'a' | 'b' | 'c' | 'd'
  text: string
}

interface QuizQuestionProps {
  index: number
  questionText: string
  options: Option[]
  selectedOption?: string | null
  correctOption?: string | null  // only passed in review mode
  marks: number
  mode: 'attempt' | 'review' | 'builder'
  onSelect?: (option: string) => void
  onDelete?: () => void
}

export default function QuizQuestion({
  index,
  questionText,
  options,
  selectedOption,
  correctOption,
  marks,
  mode,
  onSelect,
  onDelete,
}: QuizQuestionProps) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <p style={styles.questionText}>
          <span style={styles.qNum}>Q{index + 1}.</span> {questionText}
        </p>
        <div style={styles.headerRight}>
          <span style={styles.marks}>{marks} mark{marks > 1 ? 's' : ''}</span>
          {mode === 'builder' && onDelete && (
            <button onClick={onDelete} style={styles.deleteBtn}>Delete</button>
          )}
        </div>
      </div>

      <div style={styles.options}>
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key
          const isCorrect = correctOption === opt.key
          const isWrong = mode === 'review' && isSelected && !isCorrect

          let bg = '#ffffff'
          let borderColor = '#e5e7eb'
          let color = '#374151'

          if (mode === 'attempt' && isSelected) {
            bg = '#eef2ff'; borderColor = '#6366f1'; color = '#6366f1'
          }
          if (mode === 'review' && isCorrect) {
            bg = '#dcfce7'; borderColor = '#16a34a'; color = '#16a34a'
          }
          if (mode === 'review' && isWrong) {
            bg = '#fee2e2'; borderColor = '#dc2626'; color = '#dc2626'
          }
          if (mode === 'builder') {
            bg = isCorrect ? '#dcfce7' : '#ffffff'
            borderColor = isCorrect ? '#16a34a' : '#e5e7eb'
            color = isCorrect ? '#16a34a' : '#374151'
          }

          return (
            <button
              key={opt.key}
              onClick={() => mode === 'attempt' && onSelect?.(opt.key)}
              disabled={mode !== 'attempt'}
              style={{
                ...styles.option,
                backgroundColor: bg,
                borderColor,
                color,
                cursor: mode === 'attempt' ? 'pointer' : 'default',
              }}
            >
              <span style={styles.optKey}>{opt.key.toUpperCase()}.</span>
              <span>{opt.text}</span>
              {mode === 'review' && isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
              {mode === 'review' && isWrong && <span style={{ marginLeft: 'auto' }}>✗</span>}
            </button>
          )
        })}
      </div>
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
    flexDirection: 'column',
    gap: '12px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap',
  },
  questionText: {
    fontSize: '14px',
    color: '#111827',
    margin: 0,
    flex: 1,
    lineHeight: '1.5',
  },
  qNum: {
    fontWeight: '700',
    color: '#6366f1',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  marks: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    padding: 0,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid',
    fontSize: '14px',
    textAlign: 'left',
    transition: 'all 0.15s',
    width: '100%',
  },
  optKey: {
    fontWeight: '700',
    flexShrink: 0,
  },
}
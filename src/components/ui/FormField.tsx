interface FormFieldProps {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  as?: 'input' | 'textarea' | 'select'
  rows?: number
  options?: { value: string; label: string }[]
}

export default function FormField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  as = 'input',
  rows = 4,
  options,
}: FormFieldProps) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>

      {as === 'textarea' ? (
        <textarea
          required={required}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...styles.input, fontFamily: 'inherit', resize: 'vertical' }}
        />
      ) : as === 'select' ? (
        <select
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.input}
        >
          <option value="">Select...</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          required={required}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.input}
        />
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '11px 14px',
    fontSize: '15px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    color:'#111827',
  },
}
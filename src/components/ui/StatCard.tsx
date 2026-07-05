interface StatCardProps {
  label: string
  value: number
  icon: string
  color: string
  bg: string
}

export default function StatCard({ label, value, icon, color, bg }: StatCardProps) {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.iconBox, backgroundColor: bg }}>
        <span style={styles.icon}>{icon}</span>
      </div>
      <div>
        <p style={styles.label}>{label}</p>
        <p style={{ ...styles.value, color }}>{value}</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #f3f4f6',
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: '22px',
  },
  label: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '4px 0 0 0',
  },
}
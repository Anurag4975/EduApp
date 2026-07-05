import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
}: PageHeaderProps) {
  return (
    <div style={styles.header}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>

      {actionLabel && actionHref && (
        <Link href={actionHref} style={styles.actionBtn}>
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} style={styles.actionBtn}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '32px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  actionBtn: {
    padding: '10px 18px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  },
}
import Link from 'next/link'

interface EmptyStateProps {
  message: string
  linkText?: string
  linkHref?: string
}

export default function EmptyState({ message, linkText, linkHref }: EmptyStateProps) {
  return (
    <div style={styles.root}>
      <p style={styles.message}>{message}</p>
      {linkText && linkHref && (
        <Link href={linkHref} style={styles.link}>
          {linkText}
        </Link>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #f3f4f6',
    padding: '60px 20px',
    textAlign: 'center',
  },
  message: {
    color: '#9ca3af',
    fontSize: '14px',
    marginBottom: '12px',
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
  },
}
export default function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: active ? '#dcfce7' : '#fee2e2',
        color: active ? '#16a34a' : '#dc2626',
      }}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

const styles: Record<string, React.CSSProperties> = {
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
}